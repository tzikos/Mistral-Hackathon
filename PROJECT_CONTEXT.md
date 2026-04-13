# AskMe.stral — Project Context for AI Coding Agents

> This file provides full project context so an LLM coding agent can understand the codebase, make changes confidently, and avoid common pitfalls.

---

## 1. What Is This Project?

**AskMe.stral** is a platform that transforms a static CV/resume into a **living, talking AI agent**. Users create a professional profile (manually via a wizard or by uploading a PDF resume), optionally clone their voice, and get a shareable public page where anyone can **chat with their AI twin** — via text or voice — with answers grounded in real profile data.

**Built for the Mistral AI Hackathon** by team **Tirokafteri** (Dimitris Papantzikos, Michail Dikaiopoulos, Xhino Mullaymeri).

**Live URLs:**
- Frontend: `https://askmestral.vercel.app`
- Backend: `tzikos-website.onrender.com`
- Database: Supabase (managed PostgreSQL + pgvector)

---

## 2. Core Features

| Feature | Description |
|---------|-------------|
| **CV-to-Profile Pipeline** | PDF upload → Mistral OCR extracts text → Mistral Large parses it into structured JSON (skills, education, work experience, projects, certifications) |
| **AI Agent Chat** | Each profile has a conversational agent (Mistral Large) that speaks in the first person using only verified profile data |
| **Voice Cloning & Voice Chat** | Users record a short voice sample → ElevenLabs creates a personal voice clone → agent replies in the user's voice during conversations |
| **Semantic Search** | Profiles are embedded with Mistral Embed and searched via pgvector cosine similarity |
| **Keyword Search** | Token-based ranking search as a simpler alternative to semantic search |
| **Auth & Multi-User** | JWT-based register/login; each user owns and can edit their profile |

---

## 3. Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS, shadcn/ui (Radix primitives), React Router v6, TanStack Query |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **Database** | Supabase PostgreSQL with JSONB storage + pgvector extension (1024-dim embeddings) |
| **AI Models** | Mistral OCR, Mistral Large, Mistral Small, Mistral Embed, Voxtral Mini (see section 6) |
| **Voice** | ElevenLabs (voice cloning API + `eleven_multilingual_v2` TTS) |
| **Auth** | bcrypt (password hashing), python-jose (JWT tokens) |
| **Deployment** | Vercel (frontend), Render (backend), Supabase (DB), Docker + nginx available |

---

## 4. Project Structure

```
Mistral-Hackathon/
│
├── main.py                    # FastAPI app entry point, CORS, router includes, /health
├── config.py                  # BASE_DIR, UPLOADS_DIR constants
├── db.py                      # Supabase client + all DB helpers (profiles, users, embeddings, similarity search)
├── auth.py                    # bcrypt password hashing + JWT token create/verify
├── models.py                  # Pydantic models (Profile, ParsedCVProfile, Auth models)
├── prompts.py                 # CV_PARSE_PROMPT template + build_system_prompt() for agent chat
│
├── routers/
│   ├── auth.py                # /auth/register, /auth/login, /auth/me
│   ├── cv.py                  # POST /profile/{id}/parse-cv — OCR + structured extraction
│   ├── profiles.py            # CRUD, search, deep-search, avatar/CV uploads, static file serving
│   └── voice.py               # Voice clone, delete voice, voice chat (STT→LLM→TTS), text chat
│
├── services/
│   ├── clients.py             # Mistral + ElevenLabs client factories (reads env vars)
│   ├── completion.py          # Mistral chat completion wrapper
│   ├── embeddings.py          # Keyword generation (Mistral Small) + embedding (Mistral Embed) + DB storage
│   ├── search.py              # Token-based keyword search over profile rows
│   ├── stt.py                 # Mistral Voxtral Mini speech-to-text
│   └── tts.py                 # ElevenLabs text-to-speech (strips markdown before synthesis)
│
├── profiles/                  # Sample/demo profile JSON files
│
├── src/                       # ── React frontend ──
│   ├── main.tsx               # React DOM root, providers
│   ├── App.tsx                # Routing + AuthProvider + ThemeProvider
│   ├── index.css / App.css    # Global styles
│   │
│   ├── pages/
│   │   ├── Auth.tsx           # Sign in / sign up page
│   │   ├── Landing.tsx        # Search page (keyword + semantic deep search)
│   │   ├── Index.tsx          # Public profile view (portfolio, about, contact)
│   │   ├── Agent.tsx          # Voice/text chat with the AI agent
│   │   ├── CreateProfile.tsx  # Multi-step profile creation/edit wizard
│   │   └── NotFound.tsx       # 404 page
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state management (JWT, user, login/logout)
│   │   └── ThemeContext.tsx   # Light/dark theme toggle
│   │
│   ├── components/            # UI components (Navbar, Hero, About, Portfolio, Contact, GlobalMenu, dialogs, etc.)
│   │   └── ui/                # shadcn/ui primitives (button, dialog, sidebar, toast, etc.)
│   │
│   ├── lib/
│   │   ├── api.ts             # API base URL helper (VITE_API_URL or /api proxy)
│   │   ├── utils.ts           # General utilities (cn helper, etc.)
│   │   └── upload.ts          # File upload helpers
│   │
│   ├── hooks/                 # use-mobile.tsx, use-toast.ts
│   ├── types/                 # TypeScript types (profile.ts, auth.ts)
│   ├── utils/                 # accessibility-helpers.ts
│   └── styles/                # mobile-accessibility.css
│
├── index.html                 # HTML shell (loads /src/main.tsx), has theme init script
├── package.json               # Node dependencies and scripts
├── vite.config.ts             # Vite config: React SWC, @ alias → src, /api proxy to backend
├── tailwind.config.ts         # Tailwind configuration
├── postcss.config.js          # PostCSS config
├── components.json            # shadcn/ui configuration
├── tsconfig.json              # TypeScript config (base)
├── tsconfig.app.json          # App-specific TS config
├── tsconfig.node.json         # Node/tooling TS config
├── eslint.config.js           # ESLint 9 flat config
│
├── requirements.txt           # Python dependencies
├── pyproject.toml             # Python project metadata (uv-compatible)
├── uv.lock                    # uv lock file
├── .python-version            # Python 3.12
├── .env.sample                # Environment variable template
├── .gitignore                 # Git ignore rules
│
├── Dockerfile.backend         # Python 3.12-slim, requirements.txt, uvicorn on port 9122
├── Dockerfile.frontend        # Node 20 build → nginx stage; ARG VITE_API_URL for build-time
├── docker-compose.yml         # Backend (9122 internal), frontend+nginx (9123 exposed)
├── nginx.conf                 # Serves static files, proxies /api/ to backend, SPA fallback
├── render.yaml                # Render deploy blueprint
│
├── architecture.svg           # Architecture diagram (rendered)
├── architecture.d2            # Architecture diagram (D2 source)
└── PROJECT_CONTEXT.md         # This file
```

---

## 5. Frontend Routing

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/` | `Auth` | No | Sign in / sign up |
| `/search` | `Landing` | No | Search profiles (keyword + semantic) |
| `/:profileId` | `Index` | No | Public profile view |
| `/:profileId/edit` | `CreateProfile` | Yes (owner only) | Edit profile wizard |
| `/:profileId/agent` | `Agent` | Yes | Chat with AI agent (text + voice) |

---

## 6. AI Models & Where They're Used

| Model | Purpose | File |
|-------|---------|------|
| `mistral-ocr-latest` | Extracts raw text from uploaded PDF resumes | `routers/cv.py` |
| `mistral-large-latest` | Structured CV parsing via `client.chat.parse(ParsedCVProfile, ...)` | `routers/cv.py` |
| `mistral-large-latest` | Agent chat completion (answers as the profile's AI twin) | `services/completion.py` |
| `mistral-small-latest` | Keyword extraction (5-7 recruiter-style keywords for embedding enrichment) | `services/embeddings.py` |
| `mistral-embed` | Produces 1024-dim vectors for profile similarity search | `services/embeddings.py` |
| `voxtral-mini-latest` | Speech-to-text transcription of user audio input | `services/stt.py` |
| ElevenLabs Voice Add API | Voice cloning from audio sample | `routers/voice.py` |
| ElevenLabs `eleven_multilingual_v2` | Text-to-speech synthesis (uses cloned or default voice) | `services/tts.py` |

---

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Log in, receive JWT + profile_id |
| `GET` | `/auth/me` | Get current user from JWT |
| `GET` | `/profiles` | List all profiles (id + name) |
| `POST` | `/profiles` | Create a new profile |
| `GET` | `/profiles/search?q=...` | Keyword search across profiles |
| `GET` | `/profiles/deep-search?q=...` | Semantic similarity search (embeddings) |
| `POST` | `/profiles/regenerate-embeddings` | Regenerate embeddings for all profiles |
| `GET` | `/profile/{id}` | Get a single profile |
| `PUT` | `/profile/{id}` | Update a profile |
| `POST` | `/profile/{id}/parse-cv` | Upload PDF, run OCR + structured parsing |
| `POST` | `/profile/{id}/clone-voice` | Upload audio sample, create voice clone |
| `DELETE` | `/profile/{id}/voice` | Delete cloned voice |
| `POST` | `/profile/{id}/chat` | Voice chat (audio in → text + audio out) |
| `POST` | `/profile/{id}/chat/text` | Text chat (text in → text + audio out) |
| `GET` | `/health` | Health check |

---

## 8. Database Schema

**Supabase PostgreSQL** with pgvector extension:

```sql
-- Profiles: stores structured profile data as JSONB + embedding vector
CREATE TABLE profiles (
    id        TEXT PRIMARY KEY,          -- matches username
    data      JSONB NOT NULL,           -- full profile object (see models.py Profile)
    embedding vector(1024)              -- Mistral Embed vector for similarity search
);

-- Users: authentication
CREATE TABLE users (
    username        TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL        -- bcrypt hash
);

-- RPC function for pgvector cosine similarity search
CREATE OR REPLACE FUNCTION match_profiles(
    query_embedding vector(1024),
    match_threshold float,
    match_count int
) RETURNS TABLE (id text, data jsonb, similarity float);
```

---

## 9. Data Flow Diagrams

### CV Upload & Profile Creation
```
PDF Upload → mistral-ocr-latest (OCR) → raw markdown text
           → mistral-large-latest (chat.parse) → structured profile JSON
           → Stored in Supabase (JSONB)
           → mistral-small-latest (keyword gen) + mistral-embed (vectorize)
           → Embedding stored in pgvector for search
```

### Voice Chat Pipeline
```
User speaks → Audio file sent to backend
            → voxtral-mini-latest (STT) → transcribed text
            → mistral-large-latest (chat completion with profile context)
            → AI reply text
            → ElevenLabs TTS (with cloned or default voice)
            → Base64 audio returned to frontend
```

### Semantic Search
```
Search query → mistral-embed (vectorize query)
             → pgvector cosine similarity (match_profiles RPC)
             → Ranked profile results
```

---

## 10. Key Pydantic Models

The profile data structure (stored in the `data` JSONB column) follows this schema:

- **Profile**: `id`, `name`, `headline`, `badge`, `description`, `avatar`, `voice_id`, `about`, `portfolio`, `links`
- **AboutSection**: `bio` (list[str]), `skills` (list[str]), `expertise` (list[Expertise]), `education` (list[Education]), `certifications` (list[Certification])
- **PortfolioSection**: `projects`, `workExperience`, `talksAndAwards` — each is a list of `PortfolioItem` (id, title, description, detailedDescription, tags, image, link)
- **Links**: `cv`, `linkedIn`, `instagram`, `github`, `projectsLinkedIn`
- **ParsedCVProfile**: Same shape as Profile but all fields have defaults (for partial CV extraction)
- **Auth models**: `UserRegister` (username 3-30 chars alphanumeric, password 6+ chars), `UserLogin`, `TokenResponse`

---

## 11. Environment Variables

Required (from `.env.sample`):

| Variable | Purpose |
|----------|---------|
| `MISTRAL_API_KEY` | Mistral AI API key (all AI features) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key (TTS + voice cloning) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service-role key |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CORS_ORIGINS` | Comma-separated allowed origins (default: `http://localhost:5173,http://localhost:3000`) |
| `DEFAULT_VOICE_ID` | ElevenLabs fallback voice ID when no clone exists |
| `VITE_API_URL` | (Frontend build-time) Backend API URL for production |

Optional / legacy:

| Variable | Purpose |
|----------|---------|
| `MISTRAL_MAX_SENTENCES` | Limit agent response length |
| `MISTRAL_MAX_TOKENS` | Max tokens for agent responses |
| `HF_TOKEN`, `KOKORO_*` | Unused legacy vars from earlier TTS approach |

---

## 12. Dev Environment Setup

### Prerequisites
- Python 3.10+ (project uses 3.12)
- Node.js 18+
- `uv` (Python package manager) or `pip`
- API keys: Mistral AI, ElevenLabs, Supabase

### Backend
```bash
cp .env.sample .env   # fill in API keys
uv sync && uv run main.py       # Option A: uv
pip install -r requirements.txt && python main.py  # Option B: pip
# → http://localhost:8000
```

### Frontend
```bash
npm install && npm run dev
# → http://localhost:5173 (proxies /api to backend via vite.config.ts)
```

### Docker
```bash
docker-compose up
# nginx on :9123, backend on :9122 (internal)
```

---

## 13. Important Caveats & Known Issues

1. **Chat sessions are in-memory**: `routers/voice.py` stores conversation history in a Python `dict` (`_sessions`). These are lost on restart and don't work across multiple workers.

2. **Flask dependency is unused**: `pyproject.toml` and `requirements.txt` list Flask/flask-cors, but the app only uses FastAPI. These are leftover from early development.

3. **Kokoro/HF env vars are unused**: `.env.sample` includes Hugging Face and Kokoro TTS variables, but `services/tts.py` only uses ElevenLabs. These are leftovers from an earlier TTS approach.

4. **README endpoint paths are slightly off**: The README documents `GET /search` and `GET /deep-search`, but the actual implementation uses `GET /profiles/search` and `GET /profiles/deep-search`.

5. **File uploads dual storage**: `routers/profiles.py` attempts Supabase Storage first, with local `UPLOADS_DIR` as fallback.

6. **No rate limiting or input sanitization** beyond Pydantic validation — typical for hackathon code.

7. **Single-worker assumption**: The in-memory session store and local file uploads assume a single backend process.

---

## 14. Coding Conventions

- **Backend**: Python 3.12 style (union types with `|`, no `Optional`), Pydantic v2 models, FastAPI dependency injection, async route handlers
- **Frontend**: TypeScript strict mode, functional React components, shadcn/ui component library, Tailwind utility classes, TanStack Query for data fetching
- **Imports**: Backend uses relative imports within packages; frontend uses `@/` path alias (mapped to `src/` in vite.config.ts and tsconfig)
- **Formatting**: No explicit formatter config found (likely relies on editor defaults)

---

## 15. How to Add Common Things

### Adding a new API endpoint
1. Create or edit a router file in `routers/`
2. Add the router to `main.py` via `app.include_router(...)`
3. Add any new Pydantic models to `models.py`
4. Add any new DB operations to `db.py`

### Adding a new frontend page
1. Create a page component in `src/pages/`
2. Add a route in `src/App.tsx`
3. Use `@/lib/api.ts` for API calls
4. Use shadcn/ui components from `@/components/ui/`

### Adding a new AI capability
1. Ensure the Mistral client is available from `services/clients.py`
2. Create a new service file in `services/` or extend an existing one
3. Wire it into a router endpoint

### Modifying the profile schema
1. Update `models.py` (both `Profile` and `ParsedCVProfile`)
2. Update `prompts.py` (`CV_PARSE_PROMPT` and `build_system_prompt`)
3. Update frontend types in `src/types/profile.ts`
4. Update the profile wizard in `src/pages/CreateProfile.tsx`
5. Update the profile display in `src/pages/Index.tsx`
