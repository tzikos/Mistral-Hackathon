from dotenv import load_dotenv

load_dotenv()

import os
import logging

from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import json
from pathlib import Path

from models import (
    Profile,
    ParsedCVProfile,
    UserRegister,
    UserLogin,
    UserStored,
    TokenResponse,
)
from auth import hash_password, verify_password, create_access_token, decode_token

logger = logging.getLogger(__name__)

app = FastAPI()

PROFILES_DIR = Path(__file__).parent / "profiles"
USERS_DIR = Path(__file__).parent / "users"
UPLOADS_DIR = Path(__file__).parent / "uploads"

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_profile(profile_id: str) -> dict:
    path = PROFILES_DIR / f"{profile_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    return json.loads(path.read_text())


@app.get("/")
def read_root():
    return {"message": "Mistral Hackathon API - Welcome!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "mistral-hackathon-api"}


@app.get("/profiles")
def list_profiles():
    """List all available profiles (id + name only)."""
    PROFILES_DIR.mkdir(exist_ok=True)
    profiles = []
    for path in PROFILES_DIR.glob("*.json"):
        data = json.loads(path.read_text())
        profiles.append({"id": data["id"], "name": data["name"]})
    return profiles


@app.get("/profile/{profile_id}")
def get_profile(profile_id: str):
    """Return full profile JSON."""
    return _read_profile(profile_id)


@app.post("/profile", status_code=201)
def create_profile(profile: Profile):
    """Create a new profile."""
    PROFILES_DIR.mkdir(exist_ok=True)
    path = PROFILES_DIR / f"{profile.id}.json"
    if path.exists():
        raise HTTPException(status_code=409, detail=f"Profile '{profile.id}' already exists")
    path.write_text(profile.model_dump_json(indent=2))
    return {"id": profile.id, "status": "created"}


@app.put("/profile/{profile_id}")
def update_profile(profile_id: str, body: dict):
    """Update an existing profile (partial merge)."""
    path = PROFILES_DIR / f"{profile_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")
    existing = json.loads(path.read_text())

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


# ── File upload / serving ────────────────────────────────────


@app.post("/profile/{profile_id}/upload")
async def upload_file(profile_id: str, file: UploadFile = File(...)):
    """Upload a file for a profile (avatar, project image, CV, etc.)."""
    user_dir = UPLOADS_DIR / profile_id
    user_dir.mkdir(parents=True, exist_ok=True)
    dest = user_dir / file.filename
    contents = await file.read()
    dest.write_bytes(contents)
    return {"url": f"/api/uploads/{profile_id}/{file.filename}"}


@app.get("/uploads/{profile_id}/{filename}")
def serve_upload(profile_id: str, filename: str):
    """Serve an uploaded file."""
    file_path = UPLOADS_DIR / profile_id / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


# ── Mistral CV parsing ───────────────────────────────────────


def get_mistral_client():
    from mistralai import Mistral

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not configured")
    return Mistral(api_key=api_key)


CV_PARSE_PROMPT = """\
You are a CV/resume parser. Extract structured profile data from the following CV text.

RULES:
- Only use information explicitly present in the CV. Never fabricate data.
- If a field cannot be determined, leave it as the default (empty string or empty list).
- For "name": the person's full name.
- For "headline": a short phrase (max 10 words) describing their professional focus, e.g. "Translating data into actionable insights".
- For "badge": a compact dash-separated label of their top 2-3 focus areas, e.g. "Data - ML/AI - MLOps".
- For "description": 1-2 sentences summarizing who they are professionally.
- For "about.bio": 1-3 paragraphs (list of strings) about the person.
- For "about.skills": a list of technical skills / tools as short tags, e.g. ["Python", "SQL", "TensorFlow", "Docker"].
- For "about.expertise": list of expertise areas. Each has:
    - "title": short name (2-4 words)
    - "description": one sentence explaining it
    - "icon": MUST be one of: Database, Code, Activity, LineChart, BookOpen, Award, MessageCircle, Cpu, Globe, Heart, Layers, Lock, Mail, Monitor, Palette, PenTool, Rocket, Search, Server, Settings, Shield, Star, Terminal, TrendingUp, Users, Zap, Brain, Camera, Cloud, Compass, FileText, Lightbulb
    - "color": MUST be one of: blue, green, purple, amber, red, pink, indigo, teal, cyan, orange, emerald, rose
- For "about.education": list of entries with "degree", "institution", "period" (e.g. "2018-2022"), and optional "focus".
- For "about.certifications": list with "title" and "description".
- For "portfolio.workExperience": list of work experience entries. Each has:
    - "id": sequential integer starting from 0
    - "title": job title + company, e.g. "Senior Engineer @ Google"
    - "description": 1-2 sentence summary of the role
    - "detailedDescription": longer description with key responsibilities/achievements (optional)
    - "tags": list of relevant technology/skill tags for that role
    - "image": empty string ""
    - "link": null
- For "portfolio.projects": list of notable projects found in the CV, same structure as workExperience.
- For "portfolio.talksAndAwards": list of talks, publications, or awards, same structure.
- For "links": extract any URLs found:
    - "linkedIn": LinkedIn URL if present
    - "github": GitHub URL if present
    - "instagram": Instagram URL if present

CV TEXT:
{cv_text}
"""


@app.post("/profile/{profile_id}/parse-cv")
async def parse_cv(profile_id: str, file: UploadFile = File(...)):
    """Upload a PDF CV, run Mistral OCR + chat.parse, return structured profile data."""
    # Validate file type
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Read and validate size (max 10 MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Save locally
    user_dir = UPLOADS_DIR / profile_id
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = file.filename or "cv.pdf"
    dest = user_dir / filename
    dest.write_bytes(contents)
    cv_url = f"/api/uploads/{profile_id}/{filename}"

    client = get_mistral_client()

    try:
        # Upload to Mistral Files API
        from mistralai import FileChunk

        uploaded = client.files.upload(
            file=FileChunk(file_name=filename, data=contents),
            purpose="ocr",
        )
        file_id = uploaded.id

        # Run OCR
        from mistralai.models import OCRResponse

        ocr_response: OCRResponse = client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "file_id", "file_id": file_id},
        )

        # Concatenate all pages' markdown
        cv_text = "\n\n".join(page.markdown for page in ocr_response.pages)

        if not cv_text.strip():
            raise HTTPException(
                status_code=422, detail="OCR could not extract text from the PDF"
            )

        # Parse with chat
        chat_response = client.chat.parse(
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": CV_PARSE_PROMPT.format(cv_text=cv_text)}
            ],
            response_format=ParsedCVProfile,
        )

        parsed: ParsedCVProfile = chat_response.choices[0].message.parsed

        # Inject local CV URL
        parsed.links.cv = cv_url

        # Cleanup Mistral file
        try:
            client.files.delete(file_id=file_id)
        except Exception:
            logger.warning("Failed to delete Mistral file %s", file_id)

        return parsed.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("CV parsing failed")
        raise HTTPException(status_code=500, detail=f"CV parsing failed: {e}")


# ── Auth endpoints ───────────────────────────────────────────

EMPTY_PROFILE = {
    "id": "",
    "name": "",
    "headline": "",
    "badge": "",
    "description": "",
    "avatar": None,
    "about": {
        "bio": [],
        "skills": [],
        "expertise": [],
        "education": [],
        "certifications": [],
    },
    "portfolio": {"projects": [], "workExperience": [], "talksAndAwards": []},
    "links": {},
}


@app.post("/auth/register", response_model=TokenResponse)
def register(body: UserRegister):
    USERS_DIR.mkdir(exist_ok=True)
    PROFILES_DIR.mkdir(exist_ok=True)

    user_path = USERS_DIR / f"{body.username}.json"
    if user_path.exists():
        raise HTTPException(status_code=409, detail="Username already taken")

    hashed = hash_password(body.password)
    user = UserStored(username=body.username, hashed_password=hashed)
    user_path.write_text(user.model_dump_json(indent=2))

    # Create empty profile
    profile_data = {**EMPTY_PROFILE, "id": body.username, "name": body.username}
    profile_path = PROFILES_DIR / f"{body.username}.json"
    if not profile_path.exists():
        profile_path.write_text(json.dumps(profile_data, indent=2))

    token = create_access_token({"sub": body.username})
    return TokenResponse(access_token=token, profile_id=body.username)


@app.post("/auth/login", response_model=TokenResponse)
def login(body: UserLogin):
    # TODO: re-enable credential checks before production
    # For now, any login leads to the default Dimitris profile
    token = create_access_token({"sub": "dimitris"})
    return TokenResponse(access_token=token, profile_id="dimitris")


@app.get("/auth/me")
def get_current_user(authorization: str = Header()):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    payload = decode_token(authorization.removeprefix("Bearer "))
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"profile_id": payload["sub"]}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
