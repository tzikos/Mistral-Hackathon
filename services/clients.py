import os

from fastapi import HTTPException


def get_mistral_client():
    from mistralai import Mistral

    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY not configured")
    return Mistral(api_key=api_key)


def get_elevenlabs_key() -> str:
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="ELEVENLABS_API_KEY not configured")
    return key
