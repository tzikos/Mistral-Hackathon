def _text(item, key: str = "title", *fallback_keys: str) -> str | None:
    """Get text from item that may be a dict or plain string (e.g. from CV parsing)."""
    if item is None:
        return None
    if isinstance(item, str):
        return item if item.strip() else None
    if isinstance(item, dict):
        for k in (key,) + fallback_keys:
            v = item.get(k)
            if v and isinstance(v, str):
                return v
        return None
    return None


def _score(data: dict, tokens: list[str]) -> int:
    """Score a single profile against a list of query tokens."""
    total = 0

    def add(text: str | None, weight: int) -> None:
        nonlocal total
        if not text or not isinstance(text, str):
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
        add(_text(skill, "title", "name"), 8)
    for para in about.get("bio") or []:
        add(para if isinstance(para, str) else None, 2)
    for exp in about.get("expertise") or []:
        add(_text(exp, "title"), 6)
        add(_text(exp, "description"), 3)
    for edu in about.get("education") or []:
        add(_text(edu, "degree"), 4)
        add(_text(edu, "institution"), 3)
    for cert in about.get("certifications") or []:
        add(_text(cert, "title"), 4)

    portfolio = data.get("portfolio") or {}
    for work in portfolio.get("workExperience") or []:
        add(_text(work, "title"), 5)
        add(_text(work, "description"), 3)
        for tag in work.get("tags") or []:
            add(_text(tag, "title", "name"), 6)
    for proj in portfolio.get("projects") or []:
        add(_text(proj, "title"), 4)
        add(_text(proj, "description"), 3)
        for tag in proj.get("tags") or []:
            add(_text(tag, "title", "name"), 5)

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
