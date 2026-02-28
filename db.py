"""Supabase data-access layer.

Required tables (run once in the Supabase SQL editor):

    CREATE TABLE profiles (
        id   TEXT PRIMARY KEY,
        data JSONB NOT NULL
    );

    CREATE TABLE users (
        username        TEXT PRIMARY KEY,
        hashed_password TEXT NOT NULL
    );

Required env vars:
    SUPABASE_URL  — project URL  (e.g. https://xxxx.supabase.co)
    SUPABASE_KEY  — anon/service-role key
"""

import os

from fastapi import HTTPException
from supabase import create_client, Client


def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL and SUPABASE_KEY must be configured",
        )
    return create_client(url, key)


# ── Profile helpers ───────────────────────────────────────────


def db_list_profiles() -> list[dict]:
    """Return [{id, name}] for every profile."""
    result = get_supabase().table("profiles").select("id, data").execute()
    return [{"id": r["id"], "name": r["data"].get("name", "")} for r in result.data]


def db_get_profile(profile_id: str) -> dict:
    """Return the full profile dict, or raise 404."""
    result = (
        get_supabase()
        .table("profiles")
        .select("data")
        .eq("id", profile_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=404, detail=f"Profile '{profile_id}' not found"
        )
    return result.data[0]["data"]


def db_profile_exists(profile_id: str) -> bool:
    result = (
        get_supabase()
        .table("profiles")
        .select("id")
        .eq("id", profile_id)
        .execute()
    )
    return bool(result.data)


def db_create_profile(profile_id: str, data: dict) -> None:
    """Insert a new profile row. Raises 409 if id already exists."""
    if db_profile_exists(profile_id):
        raise HTTPException(
            status_code=409, detail=f"Profile '{profile_id}' already exists"
        )
    get_supabase().table("profiles").insert({"id": profile_id, "data": data}).execute()


def db_upsert_profile(profile_id: str, data: dict) -> None:
    """Insert or replace the profile row."""
    get_supabase().table("profiles").upsert({"id": profile_id, "data": data}).execute()


# ── User helpers ──────────────────────────────────────────────


def db_get_user(username: str) -> dict | None:
    """Return the user row dict, or None if not found."""
    result = (
        get_supabase()
        .table("users")
        .select("username, hashed_password")
        .eq("username", username)
        .execute()
    )
    return result.data[0] if result.data else None


def db_create_user(username: str, hashed_password: str) -> None:
    """Insert a new user. Raises 409 if username already exists."""
    if db_get_user(username) is not None:
        raise HTTPException(status_code=409, detail="Username already taken")
    get_supabase().table("users").insert(
        {"username": username, "hashed_password": hashed_password}
    ).execute()
