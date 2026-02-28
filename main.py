from dotenv import load_dotenv

load_dotenv()

import os
import io
import base64
import logging
import tempfile

from fastapi import FastAPI, HTTPException, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import json
import httpx
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
    allow_origins=os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000"
    ).split(","),
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
        # Upload file to get file_id for OCR
        from mistralai.models import OCRResponse
        
        # Upload the file to Mistral's file storage
        from mistralai.models.file import File as MistralFile
        
        file_obj = MistralFile(content=contents, file_name=filename)
        uploaded_file = client.files.upload(
            file=file_obj,
            purpose="ocr",
        )
        file_id = uploaded_file.id

        # Run OCR with file_id
        ocr_response: OCRResponse = client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "file", "file_id": file_id},
        )

        # Concatenate all pages' markdown
        cv_text = "\n\n".join(page.markdown for page in ocr_response.pages)

        if not cv_text.strip():
            raise HTTPException(
                status_code=422, detail="OCR could not extract text from the PDF"
            )

        # Parse with chat
        chat_response = client.chat.parse(
            ParsedCVProfile,
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": CV_PARSE_PROMPT.format(cv_text=cv_text)}
            ],
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
    "voice_id": None,
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
    USERS_DIR.mkdir(exist_ok=True)
    user_path = USERS_DIR / f"{body.username}.json"
    if not user_path.exists():
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user_data = json.loads(user_path.read_text())
    if not verify_password(body.password, user_data["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": body.username})
    return TokenResponse(access_token=token, profile_id=body.username)


@app.get("/auth/me")
def get_current_user(authorization: str = Header()):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    payload = decode_token(authorization.removeprefix("Bearer "))
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"profile_id": payload["sub"]}


# ── Voice cloning & conversation ─────────────────────────────


def _build_system_prompt(profile: dict) -> str:
    """Generate a system prompt from the user's profile data."""
    name = profile.get("name", "Unknown")
    headline = profile.get("headline", "")
    badge = profile.get("badge", "")
    description = profile.get("description", "")
    about = profile.get("about", {})
    portfolio = profile.get("portfolio", {})
    links = profile.get("links", {})

    bio = "\n".join(about.get("bio", []))
    skills = ", ".join(about.get("skills", []))

    education_lines = []
    for edu in about.get("education", []):
        line = f"- {edu.get('degree', '')} at {edu.get('institution', '')} ({edu.get('period', '')})"
        if edu.get("focus"):
            line += f" — Focus: {edu['focus']}"
        education_lines.append(line)
    education = "\n".join(education_lines)

    expertise_lines = []
    for exp in about.get("expertise", []):
        expertise_lines.append(f"- {exp.get('title', '')}: {exp.get('description', '')}")
    expertise = "\n".join(expertise_lines)

    work_lines = []
    for w in portfolio.get("workExperience", []):
        line = f"- {w.get('title', '')}: {w.get('description', '')}"
        if w.get("tags"):
            line += f" (Technologies: {', '.join(w['tags'])})"
        work_lines.append(line)
    work = "\n".join(work_lines)

    project_lines = []
    for p in portfolio.get("projects", []):
        line = f"- {p.get('title', '')}: {p.get('description', '')}"
        if p.get("tags"):
            line += f" (Technologies: {', '.join(p['tags'])})"
        project_lines.append(line)
    projects = "\n".join(project_lines)

    awards_lines = []
    for a in portfolio.get("talksAndAwards", []):
        awards_lines.append(f"- {a.get('title', '')}: {a.get('description', '')}")
    awards = "\n".join(awards_lines)

    certs_lines = []
    for c in about.get("certifications", []):
        certs_lines.append(f"- {c.get('title', '')}: {c.get('description', '')}")
    certs = "\n".join(certs_lines)

    link_parts = []
    for key, val in links.items():
        if val:
            link_parts.append(f"{key}: {val}")
    links_text = ", ".join(link_parts)

    prompt = f"""You are {name}, a digital AI representative. You answer questions about {name}'s professional background, education, skills, and experience. Speak in the first person as {name}. Be conversational but professional.

Profile: {headline}
Badge: {badge}
Summary: {description}

Bio:
{bio}

Skills: {skills}

Expertise:
{expertise}

Education:
{education}

Work Experience:
{work}

Projects:
{projects}

Awards & Talks:
{awards}

Certifications:
{certs}

Links: {links_text}

Guidelines:
1. Only use information from this profile. Never fabricate data.
2. If asked about something not in the profile, say you don't have that information.
3. Be concise — reply in at most 3 sentences for voice responses.
4. Be enthusiastic and approachable.
5. If asked about topics outside the professional scope, politely redirect."""
    return prompt


def _get_elevenlabs_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
    return key


@app.post("/profile/{profile_id}/clone-voice")
async def clone_voice(profile_id: str, file: UploadFile = File(...)):
    """Upload a voice sample and create a cloned voice via ElevenLabs."""
    profile_path = PROFILES_DIR / f"{profile_id}.json"
    if not profile_path.exists():
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")

    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25 MB)")

    api_key = _get_elevenlabs_key()

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                headers={"xi-api-key": api_key},
                data={
                    "name": f"clone-{profile_id}",
                    "description": f"Cloned voice for {profile_id}",
                },
                files={
                    "files": (file.filename or "voice.wav", contents, file.content_type or "audio/wav"),
                },
            )

        if resp.status_code != 200:
            logger.error("ElevenLabs clone error %s: %s", resp.status_code, resp.text)
            raise HTTPException(
                status_code=502,
                detail=f"Voice cloning failed: {resp.text}",
            )

        voice_id = resp.json().get("voice_id")
        if not voice_id:
            raise HTTPException(status_code=502, detail="No voice_id returned")

        # Save voice_id to profile
        profile_data = json.loads(profile_path.read_text())
        profile_data["voice_id"] = voice_id
        profile_path.write_text(json.dumps(profile_data, indent=2))

        return {"voice_id": voice_id, "status": "cloned"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice cloning failed")
        raise HTTPException(status_code=500, detail=f"Voice cloning failed: {e}")


@app.get("/profile/{profile_id}/voice-status")
def voice_status(profile_id: str):
    """Check if a profile has a cloned voice."""
    profile_data = _read_profile(profile_id)
    vid = profile_data.get("voice_id")
    return {"has_voice": bool(vid), "voice_id": vid}


@app.post("/profile/{profile_id}/chat")
async def voice_chat(profile_id: str, file: UploadFile = File(...)):
    """Full voice conversation: STT → Mistral completion → ElevenLabs TTS.

    Accepts an audio file, returns JSON with transcription, reply text,
    and base64-encoded audio of the reply.
    """
    profile_data = _read_profile(profile_id)

    # ── 1. Save incoming audio ───────────────────────────────
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    suffix = ".wav"
    if file.filename:
        suffix = os.path.splitext(file.filename)[1] or ".wav"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(audio_bytes)
    tmp.close()

    try:
        client = get_mistral_client()

        # ── 2. STT – transcribe with Mistral ─────────────────
        from mistralai.models.file import File as MistralFile

        audio_file_obj = MistralFile(
            content=audio_bytes,
            file_name=file.filename or "recording.wav",
        )

        transcription_models = [
            "voxtral-mini-latest",  # Voxtral Mini – primary transcription model
        ]
        env_model = os.environ.get("MISTRAL_TRANSCRIPTION_MODEL", "").strip()
        if env_model:
            transcription_models.insert(0, env_model)

        transcription_text = ""
        for model_name in transcription_models:
            try:
                result = client.audio.transcriptions.complete(
                    model=model_name,
                    file=audio_file_obj,
                )
                transcription_text = (
                    result.text if hasattr(result, "text") else str(result)
                )
                break
            except Exception as stt_err:
                logger.warning("STT model %s failed: %s", model_name, stt_err)
                continue

        if not transcription_text.strip():
            return {
                "transcription": "",
                "reply": "I couldn't hear that clearly. Could you try again?",
                "audio": None,
            }

        # ── 3. Mistral completion ────────────────────────────
        system_prompt = _build_system_prompt(profile_data)
        max_sentences = int(os.environ.get("MISTRAL_MAX_SENTENCES", "3"))
        max_tokens = int(os.environ.get("MISTRAL_MAX_TOKENS", "160"))

        constraint = f"Reply in at most {max_sentences} sentences. Be concise."
        chat_response = client.chat.complete(
            model="mistral-large-latest",
            messages=[
                {"role": "system", "content": f"{system_prompt}\n\n{constraint}"},
                {"role": "user", "content": transcription_text},
            ],
            max_tokens=max_tokens,
        )
        reply_text = chat_response.choices[0].message.content.strip()

        # ── 4. TTS – ElevenLabs ──────────────────────────────
        voice_id = profile_data.get("voice_id")
        audio_b64 = None

        if voice_id:
            try:
                api_key = _get_elevenlabs_key()
                async with httpx.AsyncClient(timeout=60) as http:
                    tts_resp = await http.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                        headers={
                            "xi-api-key": api_key,
                            "Content-Type": "application/json",
                            "Accept": "audio/mpeg",
                        },
                        json={
                            "text": reply_text,
                            "model_id": "eleven_multilingual_v2",
                            "voice_settings": {
                                "stability": 0.5,
                                "similarity_boost": 0.8,
                            },
                        },
                    )
                if tts_resp.status_code == 200:
                    audio_b64 = base64.b64encode(tts_resp.content).decode("utf-8")
                else:
                    logger.warning("ElevenLabs TTS error %s: %s", tts_resp.status_code, tts_resp.text)
            except Exception as tts_err:
                logger.warning("TTS failed: %s", tts_err)

        return {
            "transcription": transcription_text,
            "reply": reply_text,
            "audio": {"base64": audio_b64, "format": "mp3"} if audio_b64 else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Voice chat failed")
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {e}")
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=os.environ.get("ENV", "dev") == "dev",
    )
