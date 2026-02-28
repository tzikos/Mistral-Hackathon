import json

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from config import PROFILES_DIR, UPLOADS_DIR
from models import Profile

router = APIRouter()


def read_profile(profile_id: str) -> dict:
    path = PROFILES_DIR / f"{profile_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    return json.loads(path.read_text())


@router.get("/profiles")
def list_profiles():
    """List all available profiles (id + name only)."""
    PROFILES_DIR.mkdir(exist_ok=True)
    profiles = []
    for path in PROFILES_DIR.glob("*.json"):
        data = json.loads(path.read_text())
        profiles.append({"id": data["id"], "name": data["name"]})
    return profiles


@router.get("/profile/{profile_id}")
def get_profile(profile_id: str):
    """Return full profile JSON."""
    return read_profile(profile_id)


@router.post("/profile", status_code=201)
def create_profile(profile: Profile):
    """Create a new profile."""
    PROFILES_DIR.mkdir(exist_ok=True)
    path = PROFILES_DIR / f"{profile.id}.json"
    if path.exists():
        raise HTTPException(status_code=409, detail=f"Profile '{profile.id}' already exists")
    path.write_text(profile.model_dump_json(indent=2))
    return {"id": profile.id, "status": "created"}


@router.put("/profile/{profile_id}")
def update_profile(profile_id: str, body: dict):
    """Update an existing profile (partial merge), or create if missing."""
    PROFILES_DIR.mkdir(exist_ok=True)
    path = PROFILES_DIR / f"{profile_id}.json"
    existing = json.loads(path.read_text()) if path.exists() else {"id": profile_id}

    def _deep_merge(base: dict, patch: dict) -> dict:
        for key, value in patch.items():
            if isinstance(value, dict) and isinstance(base.get(key), dict):
                base[key] = _deep_merge(base[key], value)
            else:
                base[key] = value
        return base

    merged = _deep_merge(existing, body)
    merged["id"] = profile_id  # prevent id change
    path.write_text(json.dumps(merged, indent=2))
    return {"id": profile_id, "status": "updated"}


@router.post("/profile/{profile_id}/upload")
async def upload_file(profile_id: str, file: UploadFile = File(...)):
    """Upload a file for a profile (avatar, project image, CV, etc.)."""
    user_dir = UPLOADS_DIR / profile_id
    user_dir.mkdir(parents=True, exist_ok=True)
    dest = user_dir / file.filename
    contents = await file.read()
    dest.write_bytes(contents)
    return {"url": f"/uploads/{profile_id}/{file.filename}"}


@router.get("/uploads/{profile_id}/{filename}")
def serve_upload(profile_id: str, filename: str):
    """Serve an uploaded file."""
    file_path = UPLOADS_DIR / profile_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
