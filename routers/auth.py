import json

from fastapi import APIRouter, HTTPException, Header

from auth import hash_password, verify_password, create_access_token, decode_token
from config import PROFILES_DIR, USERS_DIR
from models import UserRegister, UserLogin, UserStored, TokenResponse

router = APIRouter(prefix="/auth")

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


@router.post("/register", response_model=TokenResponse)
def register(body: UserRegister):
    USERS_DIR.mkdir(exist_ok=True)
    PROFILES_DIR.mkdir(exist_ok=True)

    user_path = USERS_DIR / f"{body.username}.json"
    if user_path.exists():
        raise HTTPException(status_code=409, detail="Username already taken")

    hashed = hash_password(body.password)
    user = UserStored(username=body.username, hashed_password=hashed)
    user_path.write_text(user.model_dump_json(indent=2))

    profile_data = {**EMPTY_PROFILE, "id": body.username, "name": body.username}
    profile_path = PROFILES_DIR / f"{body.username}.json"
    if not profile_path.exists():
        profile_path.write_text(json.dumps(profile_data, indent=2))

    token = create_access_token({"sub": body.username})
    return TokenResponse(access_token=token, profile_id=body.username)


@router.post("/login", response_model=TokenResponse)
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


@router.get("/me")
def get_current_user(authorization: str = Header()):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    payload = decode_token(authorization.removeprefix("Bearer "))
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"profile_id": payload["sub"]}
