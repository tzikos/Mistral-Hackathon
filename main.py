from dotenv import load_dotenv

load_dotenv()

import os
import logging

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, cv, profiles, voice

logging.basicConfig(level=logging.INFO)

app = FastAPI()

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

app.include_router(profiles.router)
app.include_router(cv.router)
app.include_router(auth.router)
app.include_router(voice.router)


@app.get("/")
def read_root():
    return {"message": "Mistral Hackathon API - Welcome!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "mistral-hackathon-api"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "8000")),
        reload=os.environ.get("ENV", "dev") == "dev",
    )
