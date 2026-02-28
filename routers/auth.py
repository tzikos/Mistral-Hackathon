from fastapi import APIRouter, HTTPException, Header

from auth import hash_password, verify_password, create_access_token, decode_token
from db import db_get_user, db_create_user, db_upsert_profile
from models import UserRegister, UserLogin, TokenResponse

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
    hashed = hash_password(body.password)
    db_create_user(body.username, hashed)  # raises 409 if taken

    # Create an empty profile for the new user (upsert is safe on race)
    profile_data = {**EMPTY_PROFILE, "id": body.username, "name": body.username}
    db_upsert_profile(body.username, profile_data)

    token = create_access_token({"sub": body.username})
    return TokenResponse(access_token=token, profile_id=body.username)


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin):
    user = db_get_user(body.username)
    if user is None or not verify_password(body.password, user["hashed_password"]):
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
