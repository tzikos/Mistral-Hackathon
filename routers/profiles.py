import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response

from config import UPLOADS_DIR
from db import (
    db_list_profiles,
    db_get_profile,
    db_create_profile,
    db_upsert_profile,
    db_get_all_profiles_raw,
    db_similarity_search,
    get_supabase,
)
from services.search import search_profiles
from services.embeddings import embed_text, generate_and_store_embedding
from models import Profile

logger = logging.getLogger(__name__)
router = APIRouter()


def read_profile(profile_id: str) -> dict:
    """Shared helper used by other routers."""
    return db_get_profile(profile_id)


@router.get("/profiles")
def list_profiles():
    """List all available profiles (id + name only)."""
    return db_list_profiles()


@router.get("/profiles/search")
def search_profiles_endpoint(q: str = ""):
    """Search profiles by free text. Returns ranked lightweight profile cards."""
    if not q.strip():
        return []
    rows = db_get_all_profiles_raw()
    return search_profiles(rows, q)


@router.get("/profiles/deep-search")
def deep_search_profiles_endpoint(q: str = ""):
    """Semantic search via Mistral embeddings + pgvector cosine similarity."""
    if not q.strip():
        return []
    query_embedding = embed_text(q.strip())
    rows = db_similarity_search(query_embedding)
    cards = []
    for row in rows:
        data = row.get("data") or {}
        about = data.get("about") or {}
        skills = about.get("skills") or []
        cards.append({
            "id": row["id"],
            "name": data.get("name", ""),
            "headline": data.get("headline", ""),
            "badge": data.get("badge", ""),
            "avatar": data.get("avatar"),
            "voice_id": data.get("voice_id"),
            "skills": skills[:6],
            "score": row.get("similarity", 0.0),
        })
    return cards


@router.post("/profiles/regenerate-embeddings")
def regenerate_embeddings_endpoint(background_tasks: BackgroundTasks):
    """Bulk re-generate embeddings for all existing profiles (for seeding)."""
    rows = db_get_all_profiles_raw()
    for row in rows:
        profile_id = row["id"]
        data = row.get("data") or {}
        background_tasks.add_task(generate_and_store_embedding, profile_id, data)
    return {"status": "started", "profiles": len(rows)}


@router.get("/profile/{profile_id}")
def get_profile(profile_id: str):
    """Return full profile JSON."""
    return db_get_profile(profile_id)


@router.post("/profile", status_code=201)
def create_profile(profile: Profile, background_tasks: BackgroundTasks):
    """Create a new profile."""
    data = profile.model_dump()
    db_create_profile(profile.id, data)
    background_tasks.add_task(generate_and_store_embedding, profile.id, data)
    return {"id": profile.id, "status": "created"}


@router.put("/profile/{profile_id}")
def update_profile(profile_id: str, body: dict, background_tasks: BackgroundTasks):
    """Update an existing profile (partial merge), or create if missing."""
    try:
        existing = db_get_profile(profile_id)
    except HTTPException:
        existing = {"id": profile_id}

    def _deep_merge(base: dict, patch: dict) -> dict:
        for key, value in patch.items():
            if value is None:
                base.pop(key, None)  # null means "remove this key"
            elif isinstance(value, dict) and isinstance(base.get(key), dict):
                base[key] = _deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    merged = _deep_merge(existing, body)
    merged["id"] = profile_id  # prevent id change
    db_upsert_profile(profile_id, merged)
    background_tasks.add_task(generate_and_store_embedding, profile_id, merged)
    return {"id": profile_id, "status": "updated"}


@router.post("/profile/{profile_id}/upload")
async def upload_file(profile_id: str, file: UploadFile = File(...)):
    """Upload a file to Supabase Storage (falls back to local disk)."""
    contents = await file.read()
    filename = file.filename or "upload"
    storage_path = f"{profile_id}/{filename}"

    try:
        supabase = get_supabase()
        supabase.storage.from_("uploads").upload(
            storage_path,
            contents,
            file_options={
                "content-type": file.content_type or "application/octet-stream",
                "upsert": "true",
            },
        )
        public_url = supabase.storage.from_("uploads").get_public_url(storage_path)
        return {"url": public_url}
    except Exception:
        # Fallback to local disk storage
        user_dir = UPLOADS_DIR / profile_id
        user_dir.mkdir(parents=True, exist_ok=True)
        dest = user_dir / filename
        dest.write_bytes(contents)
        return {"url": f"/uploads/{profile_id}/{filename}"}


@router.get("/profile/{profile_id}/cv/download")
async def download_cv(profile_id: str):
    """Proxy-download the profile's CV so the browser downloads it instead of opening it."""
    profile = db_get_profile(profile_id)
    cv_url = (profile.get("links") or {}).get("cv")
    if not cv_url:
        raise HTTPException(status_code=404, detail="No CV on file")

    # Local file (relative path starting with /)
    if cv_url.startswith("/uploads/"):
        local_path = UPLOADS_DIR / "/".join(cv_url.split("/")[2:])
        if not local_path.exists():
            raise HTTPException(status_code=404, detail="CV file not found")
        filename = local_path.name
        content = local_path.read_bytes()
    else:
        # Remote URL (e.g. Supabase public URL) – proxy through backend
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(cv_url, follow_redirects=True, timeout=30)
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail="Could not fetch CV")
            content = r.content
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=str(exc))
        # Derive filename from the URL path
        filename = cv_url.rstrip("/").split("/")[-1].split("?")[0] or "cv.pdf"

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/uploads/{profile_id}/{filename}")
def serve_upload(profile_id: str, filename: str):
    """Serve an uploaded file."""
    file_path = UPLOADS_DIR / profile_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
