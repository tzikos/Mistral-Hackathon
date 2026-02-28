def _score(data: dict, tokens: list[str]) -> int:
    """Score a single profile against a list of query tokens."""
    total = 0

    def add(text: str | None, weight: int) -> None:
        nonlocal total
        if not text:
            return
        tl = text.lower()
        for t in tokens:
            if t in tl:
                total += weight

    add(data.get("name"), 10)
    add(data.get("headline"), 7)
    add(data.get("badge"), 5)
    add(data.get("description"), 3)

    about = data.get("about") or {}
    for skill in about.get("skills") or []:
        add(skill, 8)
    for para in about.get("bio") or []:
        add(para, 2)
    for exp in about.get("expertise") or []:
        add(exp.get("title"), 6)
        add(exp.get("description"), 3)
    for edu in about.get("education") or []:
        add(edu.get("degree"), 4)
        add(edu.get("institution"), 3)
    for cert in about.get("certifications") or []:
        add(cert.get("title"), 4)

    portfolio = data.get("portfolio") or {}
    for work in portfolio.get("workExperience") or []:
        add(work.get("title"), 5)
        add(work.get("description"), 3)
        for tag in work.get("tags") or []:
            add(tag, 6)
    for proj in portfolio.get("projects") or []:
        add(proj.get("title"), 4)
        add(proj.get("description"), 3)
        for tag in proj.get("tags") or []:
            add(tag, 5)

    return total


def search_profiles(rows: list[dict], query: str, limit: int = 20) -> list[dict]:
    """Score and rank profiles against a free-text query.

    Args:
        rows: Raw Supabase rows — each is {"id": str, "data": {...}}.
        query: User search string.
        limit: Maximum number of results to return.

    Returns:
        Ranked list of lightweight profile dicts (id, name, headline, badge,
        avatar, voice_id, skills, score), score > 0 only.
    """
    tokens = [t.lower() for t in query.split() if len(t) >= 2]
    if not tokens:
        return []

    results = []
    for row in rows:
        data = row.get("data") or {}
        score = _score(data, tokens)
        if score > 0:
            results.append({
                "id": row.get("id") or data.get("id", ""),
                "name": data.get("name", ""),
                "headline": data.get("headline", ""),
                "badge": data.get("badge", ""),
                "avatar": data.get("avatar"),
                "voice_id": data.get("voice_id"),
                "skills": (data.get("about") or {}).get("skills", [])[:6],
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:limit]
