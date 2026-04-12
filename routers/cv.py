import base64
import logging

from fastapi import APIRouter, HTTPException, UploadFile, File

from config import UPLOADS_DIR
from models import ParsedCVProfile
from prompts import CV_PARSE_PROMPT
from services.clients import get_mistral_client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/profile/{profile_id}/parse-cv")
async def parse_cv(profile_id: str, file: UploadFile = File(...)):
    """Upload a PDF CV, run Mistral OCR + chat.parse, return structured profile data."""
    if file.content_type not in ("application/pdf",):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    # Save locally
    user_dir = UPLOADS_DIR / profile_id
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = file.filename or "cv.pdf"
    dest = user_dir / filename
    dest.write_bytes(contents)
    cv_url = f"/uploads/{profile_id}/{filename}"

    client = get_mistral_client()

    try:
        from mistralai.models import OCRResponse

        b64_pdf = base64.b64encode(contents).decode("utf-8")
        data_url = f"data:application/pdf;base64,{b64_pdf}"

        ocr_response: OCRResponse = client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "document_url", "document_url": data_url},
        )

        cv_text = "\n\n".join(page.markdown for page in ocr_response.pages)

        if not cv_text.strip():
            raise HTTPException(
                status_code=422, detail="OCR could not extract text from the PDF"
            )

        # Parse structured profile with chat
        chat_response = client.chat.parse(
            ParsedCVProfile,
            model="mistral-large-latest",
            messages=[
                {"role": "user", "content": CV_PARSE_PROMPT.format(cv_text=cv_text)}
            ],
        )

        parsed: ParsedCVProfile = chat_response.choices[0].message.parsed
        parsed.links.cv = cv_url

        return parsed.model_dump()

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("CV parsing failed")
        raise HTTPException(status_code=500, detail=f"CV parsing failed: {e}")
