from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from config import UPLOADS_DIR
from db import (
    db_list_profiles,
    db_get_profile,
    db_create_profile,
    db_upsert_profile,
    db_get_all_profiles_raw,
    get_supabase,
)
from services.search import search_profiles
from models import Profile

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


@router.get("/profile/{profile_id}")
def get_profile(profile_id: str):
    """Return full profile JSON."""
    return db_get_profile(profile_id)


@router.post("/profile", status_code=201)
def create_profile(profile: Profile):
    """Create a new profile."""
    db_create_profile(profile.id, profile.model_dump())
    return {"id": profile.id, "status": "created"}


@router.put("/profile/{profile_id}")
def update_profile(profile_id: str, body: dict):
    """Update an existing profile (partial merge), or create if missing."""
    try:
        existing = db_get_profile(profile_id)
    except HTTPException:
        existing = {"id": profile_id}

    def _deep_merge(base: dict, patch: dict) -> dict:
        for key, value in patch.items():
            if isinstance(value, dict) and isinstance(base.get(key), dict):
                base[key] = _deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    merged = _deep_merge(existing, body)
    merged["id"] = profile_id  # prevent id change
    db_upsert_profile(profile_id, merged)
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


@router.get("/uploads/{profile_id}/{filename}")
def serve_upload(profile_id: str, filename: str):
    """Serve an uploaded file."""
    file_path = UPLOADS_DIR / profile_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
