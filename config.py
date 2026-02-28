from pathlib import Path

BASE_DIR = Path(__file__).parent

# Binary file uploads (avatars, CVs) are still served from disk
UPLOADS_DIR = BASE_DIR / "uploads"
