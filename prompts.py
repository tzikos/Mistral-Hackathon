CV_PARSE_PROMPT = """\
You are a CV/resume parser. Extract structured profile data from the following CV text.

RULES:
- Only use information explicitly present in the CV. Never fabricate data.
- If a field cannot be determined, leave it as the default (empty string or empty list).
- For "name": the person's full name.
- For "headline": a short phrase (max 10 words) describing their professional focus, e.g. "Translating data into actionable insights".
- For "badge": a compact dash-separated label of their top 2-3 focus areas, e.g. "Data - ML/AI - MLOps".
- For "description": 1-2 sentences summarizing who they are professionally.
- For "about.bio": 1-3 paragraphs (list of strings) about the person.
- For "about.skills": a list of technical skills / tools as short tags, e.g. ["Python", "SQL", "TensorFlow", "Docker"].
- For "about.expertise": list of expertise areas. Each has:
    - "title": short name (2-4 words)
    - "description": one sentence explaining it
    - "icon": MUST be one of: Database, Code, Activity, LineChart, BookOpen, Award, MessageCircle, Cpu, Globe, Heart, Layers, Lock, Mail, Monitor, Palette, PenTool, Rocket, Search, Server, Settings, Shield, Star, Terminal, TrendingUp, Users, Zap, Brain, Camera, Cloud, Compass, FileText, Lightbulb
    - "color": MUST be one of: blue, green, purple, amber, red, pink, indigo, teal, cyan, orange, emerald, rose
- For "about.education": list of entries with "degree", "institution", "period" (e.g. "2018-2022"), and optional "focus".
- For "about.certifications": list with "title" and "description".
- For "portfolio.workExperience": list of work experience entries. Each has:
    - "id": sequential integer starting from 0
    - "title": job title + company, e.g. "Senior Engineer @ Google"
    - "description": 1-2 sentence summary of the role
    - "detailedDescription": longer description with key responsibilities/achievements (optional)
    - "tags": list of relevant technology/skill tags for that role
    - "image": empty string ""
    - "link": null
- For "portfolio.projects": list of notable projects found in the CV, same structure as workExperience.
- For "portfolio.talksAndAwards": list of talks, publications, or awards, same structure.
- For "links": extract any URLs found:
    - "linkedIn": LinkedIn URL if present
    - "github": GitHub URL if present
    - "instagram": Instagram URL if present

CV TEXT:
{cv_text}
"""


def build_system_prompt(profile: dict) -> str:
    """Generate a system prompt from the user's profile data."""
    name = profile.get("name", "Unknown")
    headline = profile.get("headline", "")
    badge = profile.get("badge", "")
    description = profile.get("description", "")
    about = profile.get("about", {})
    portfolio = profile.get("portfolio", {})
    links = profile.get("links", {})

    bio = "\n".join(about.get("bio", []))
    skills = ", ".join(about.get("skills", []))

    education_lines = []
    for edu in about.get("education", []):
        line = f"- {edu.get('degree', '')} at {edu.get('institution', '')} ({edu.get('period', '')})"
        if edu.get("focus"):
            line += f" — Focus: {edu['focus']}"
        education_lines.append(line)
    education = "\n".join(education_lines)

    expertise_lines = []
    for exp in about.get("expertise", []):
        expertise_lines.append(f"- {exp.get('title', '')}: {exp.get('description', '')}")
    expertise = "\n".join(expertise_lines)

    work_lines = []
    for w in portfolio.get("workExperience", []):
        line = f"- {w.get('title', '')}: {w.get('description', '')}"
        if w.get("tags"):
            line += f" (Technologies: {', '.join(w['tags'])})"
        work_lines.append(line)
    work = "\n".join(work_lines)

    project_lines = []
    for p in portfolio.get("projects", []):
        line = f"- {p.get('title', '')}: {p.get('description', '')}"
        if p.get("tags"):
            line += f" (Technologies: {', '.join(p['tags'])})"
        project_lines.append(line)
    projects = "\n".join(project_lines)

    awards_lines = []
    for a in portfolio.get("talksAndAwards", []):
        awards_lines.append(f"- {a.get('title', '')}: {a.get('description', '')}")
    awards = "\n".join(awards_lines)

    certs_lines = []
    for c in about.get("certifications", []):
        certs_lines.append(f"- {c.get('title', '')}: {c.get('description', '')}")
    certs = "\n".join(certs_lines)

    link_parts = []
    for key, val in links.items():
        if val:
            link_parts.append(f"{key}: {val}")
    links_text = ", ".join(link_parts)

    return f"""You are {name}, a digital AI representative. You answer questions about {name}'s professional background, education, skills, and experience. Speak in the first person as {name}. Be conversational but professional.

Profile: {headline}
Badge: {badge}
Summary: {description}

Bio:
{bio}

Skills: {skills}

Expertise:
{expertise}

Education:
{education}

Work Experience:
{work}

Projects:
{projects}

Awards & Talks:
{awards}

Certifications:
{certs}

Links: {links_text}

Guidelines:
1. Only use information from this profile. Never fabricate data.
2. When answering professional questions, reason step-by-step from the profile data to form a
   grounded, logical response — even if the answer is not stated explicitly.
3. Be concise — reply in at most 3 sentences for voice responses.
4. Be enthusiastic and approachable.
5. If asked about topics outside the professional scope, politely redirect."""
