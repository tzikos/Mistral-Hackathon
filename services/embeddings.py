import logging

from services.clients import get_mistral_client

logger = logging.getLogger(__name__)


def build_profile_text(data: dict) -> str:
    """Extract key text fields from a profile dict into a summary string."""
    parts = []

    if name := data.get("name"):
        parts.append(f"Name: {name}")
    if headline := data.get("headline"):
        parts.append(f"Headline: {headline}")
    if badge := data.get("badge"):
        parts.append(f"Badge: {badge}")
    if description := data.get("description"):
        parts.append(f"Description: {description}")

    about = data.get("about") or {}
    if bio := about.get("bio"):
        if isinstance(bio, list):
            parts.append("Bio: " + " ".join(bio))
        else:
            parts.append(f"Bio: {bio}")
    if skills := about.get("skills"):
        parts.append("Skills: " + ", ".join(skills))
    if expertise := about.get("expertise"):
        labels = [e.get("label", "") if isinstance(e, dict) else str(e) for e in expertise]
        parts.append("Expertise: " + ", ".join(filter(None, labels)))
    if education := about.get("education"):
        edu_texts = []
        for e in education:
            if isinstance(e, dict):
                edu_texts.append(f"{e.get('degree', '')} at {e.get('institution', '')}")
            else:
                edu_texts.append(str(e))
        parts.append("Education: " + "; ".join(edu_texts))
    if certs := about.get("certifications"):
        parts.append("Certifications: " + ", ".join(certs if isinstance(certs, list) else [str(certs)]))

    portfolio = data.get("portfolio") or {}
    if projects := portfolio.get("projects"):
        titles = [p.get("title", "") if isinstance(p, dict) else str(p) for p in projects]
        parts.append("Projects: " + ", ".join(filter(None, titles)))
    if work_exp := portfolio.get("workExperience"):
        roles = []
        for w in work_exp:
            if isinstance(w, dict):
                roles.append(f"{w.get('role', '')} at {w.get('company', '')}")
            else:
                roles.append(str(w))
        parts.append("Work Experience: " + "; ".join(roles))

    return "\n".join(parts)


def generate_keywords(profile_data: dict) -> str:
    """Call mistral-small-latest to produce 5-7 concise keywords describing the profile."""
    client = get_mistral_client()
    profile_text = build_profile_text(profile_data)

    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional recruiter assistant. "
                    "Given a professional profile, extract 5-7 concise, "
                    "comma-separated keywords that best describe the person's "
                    "skills, domain, and expertise. Output ONLY the keywords, "
                    "nothing else. Example: python, machine learning, nlp, pytorch, research"
                ),
            },
            {"role": "user", "content": profile_text},
        ],
        max_tokens=100,
    )
    return response.choices[0].message.content.strip()


def embed_text(text: str) -> list[float]:
    """Call mistral-embed to get a 1024-dim float list."""
    client = get_mistral_client()
    response = client.embeddings.create(
        model="mistral-embed",
        inputs=[text],
    )
    return response.data[0].embedding


def generate_and_store_embedding(profile_id: str, profile_data: dict) -> None:
    """Orchestrate keyword gen + embed + store in Supabase."""
    from db import db_store_embedding

    try:
        logger.info("Generating keywords for profile '%s'", profile_id)
        keywords = generate_keywords(profile_data)
        logger.info("Keywords for '%s': %s", profile_id, keywords)

        profile_text = build_profile_text(profile_data)
        combined_text = f"{profile_text}\nKeywords: {keywords}"

        logger.info("Embedding profile '%s'", profile_id)
        embedding = embed_text(combined_text)

        db_store_embedding(profile_id, embedding)
        logger.info("Stored embedding for profile '%s'", profile_id)
    except Exception as exc:
        logger.error("Failed to generate/store embedding for '%s': %s", profile_id, exc)
