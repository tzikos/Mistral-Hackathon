from pydantic import BaseModel, Field


class Expertise(BaseModel):
    title: str
    description: str
    icon: str
    color: str


class Education(BaseModel):
    degree: str
    institution: str
    period: str
    focus: str | None = None


class Certification(BaseModel):
    title: str
    description: str


class AboutSection(BaseModel):
    bio: list[str]
    skills: list[str]
    expertise: list[Expertise]
    education: list[Education]
    certifications: list[Certification]


class PortfolioItem(BaseModel):
    id: int
    title: str
    description: str
    detailedDescription: str | None = None
    tags: list[str]
    image: str
    link: str | None = None


class PortfolioSection(BaseModel):
    projects: list[PortfolioItem]
    workExperience: list[PortfolioItem]
    talksAndAwards: list[PortfolioItem]


class Links(BaseModel):
    cv: str | None = None
    linkedIn: str | None = None
    instagram: str | None = None
    github: str | None = None
    projectsLinkedIn: str | None = None


class Profile(BaseModel):
    id: str
    name: str
    headline: str
    badge: str
    description: str
    avatar: str | None = None
    about: AboutSection
    portfolio: PortfolioSection
    links: Links


# ── CV parsing model (all fields optional for partial extraction) ──


class ParsedCVProfile(BaseModel):
    name: str = ""
    headline: str = ""
    badge: str = ""
    description: str = ""
    about: AboutSection = AboutSection(
        bio=[], skills=[], expertise=[], education=[], certifications=[]
    )
    portfolio: PortfolioSection = PortfolioSection(
        projects=[], workExperience=[], talksAndAwards=[]
    )
    links: Links = Links()


# ── Auth models ──────────────────────────────────────────────


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserStored(BaseModel):
    username: str
    hashed_password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    profile_id: str
