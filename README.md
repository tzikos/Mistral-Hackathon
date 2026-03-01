# AskMe.stral — Your AI-Powered Professional Profile

> Upload your CV, clone your voice, and let an AI agent answer questions **as you**.

**[Try it live: askmestral.vercel.app](https://askmestral.vercel.app)**

---

## What is AskMe.stral?

AskMe.stral is a platform that turns a static CV into a **living, talking AI agent**. Professionals create a profile (manually or by uploading a PDF resume), optionally clone their voice, and get a shareable page where recruiters, collaborators, or anyone can **chat with their AI twin** — via text or voice — and get answers grounded in real profile data.

### Key Capabilities

- **CV-to-Profile Pipeline** — Upload a PDF resume; Mistral OCR extracts the text, then Mistral Large parses it into a structured profile (skills, education, work experience, projects, certifications).
- **AI Agent Chat** — Each profile has its own conversational agent powered by Mistral Large that speaks in the first person using only verified profile data.
- **Voice Cloning & Voice Chat** — Record a short voice sample to create a personal voice clone (ElevenLabs). The agent then **replies in your voice** during voice conversations.
- **Semantic Search** — Find professionals by meaning, not just keywords. Profiles are embedded with Mistral Embed and searched via pgvector similarity.
- **Auth & Multi-User** — Register, log in, and manage your own profile with JWT-based authentication.

---

## Architecture

![Architecture Diagram](architecture.svg)

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix) |
| **Backend** | Python, FastAPI, Uvicorn |
| **Database** | Supabase (PostgreSQL + JSONB + pgvector) |
| **AI** | Mistral AI (OCR, Chat, Embeddings, STT), ElevenLabs (TTS, Voice Cloning) |

---

## Mistral Models Used

This project is built almost entirely on the **Mistral AI model family**. Here is every model and exactly where it is used:

| Mistral Model | Purpose | Where |
|---|---|---|
| **`mistral-ocr-latest`** | Extracts raw text from uploaded PDF resumes via OCR | [`routers/cv.py`](routers/cv.py) — `client.ocr.process(...)` |
| **`mistral-large-latest`** | **Structured CV parsing** — converts OCR text into a typed profile schema using `chat.parse` | [`routers/cv.py`](routers/cv.py) — `client.chat.parse(ParsedCVProfile, ...)` |
| **`mistral-large-latest`** | **Agent chat completion** — powers the conversational AI agent for every profile | [`services/completion.py`](services/completion.py) — `client.chat.complete(...)` |
| **`mistral-small-latest`** | **Keyword extraction** — generates 5–7 recruiter-style keywords from profile data for embedding enrichment | [`services/embeddings.py`](services/embeddings.py) — `client.chat.complete(...)` |
| **`mistral-embed`** | **Semantic embeddings** — produces 1024-dim vectors for profile similarity search | [`services/embeddings.py`](services/embeddings.py) — `client.embeddings.create(...)` |
| **`voxtral-mini-latest`** | **Speech-to-text** — transcribes user audio input during voice chat | [`services/stt.py`](services/stt.py) — `client.audio.transcriptions.complete(...)` |

### ElevenLabs Integration

| Feature | Model / API | Where |
|---|---|---|
| **Voice Cloning** | ElevenLabs Voice Add API | [`routers/voice.py`](routers/voice.py) — `POST /v1/voices/add` |
| **Text-to-Speech** | `eleven_multilingual_v2` | [`services/tts.py`](services/tts.py) — `POST /v1/text-to-speech/{voice_id}` |

---

## How It Works — End-to-End Flows

### 1. CV Upload & Profile Creation

```
PDF Upload → mistral-ocr-latest (OCR) → raw markdown text
         → mistral-large-latest (chat.parse) → structured profile JSON
         → Stored in Supabase (JSONB)
         → mistral-small-latest (keyword gen) + mistral-embed (vectorize)
         → Embedding stored in pgvector for search
```

### 2. Voice Chat Pipeline

```
User speaks → Audio file sent to backend
           → voxtral-mini-latest (STT) → transcribed text
           → mistral-large-latest (chat completion with profile context)
           → AI reply text
           → ElevenLabs TTS (with cloned or default voice)
           → Base64 audio returned to frontend
```

### 3. Semantic Search

```
Search query → mistral-embed (vectorize query)
            → pgvector cosine similarity (match_profiles RPC)
            → Ranked profile results
```

---

## Project Structure

```
Mistral-Hackathon/
│
├── main.py                    # FastAPI app entry point
├── config.py                  # Base path, uploads directory
├── db.py                      # Supabase CRUD, embeddings, similarity search
├── auth.py                    # Password hashing (bcrypt), JWT tokens
├── models.py                  # Pydantic models (Profile, ParsedCVProfile, Auth)
├── prompts.py                 # CV parsing prompt + agent system prompt builder
│
├── routers/
│   ├── auth.py                # /auth/register, /auth/login, /auth/me
│   ├── cv.py                  # /profile/{id}/parse-cv (OCR + structured extraction)
│   ├── profiles.py            # CRUD, search, deep-search, avatar/CV uploads
│   └── voice.py               # Voice clone, voice chat (STT→LLM→TTS), text chat
│
├── services/
│   ├── clients.py             # Mistral & ElevenLabs client factories
│   ├── completion.py          # Mistral chat completion wrapper
│   ├── embeddings.py          # Keyword generation + embedding + storage
│   ├── search.py              # Token-based keyword search
│   ├── stt.py                 # Mistral audio transcription
│   └── tts.py                 # ElevenLabs text-to-speech
│
├── src/                       # React frontend (Vite + TypeScript)
│   ├── App.tsx                # Routing, AuthProvider, protected routes
│   ├── pages/
│   │   ├── Landing.tsx        # Search page (keyword + semantic deep search)
│   │   ├── Index.tsx          # Public profile view
│   │   ├── Agent.tsx          # Voice/text chat with the AI agent
│   │   ├── CreateProfile.tsx  # Multi-step profile wizard
│   │   └── Auth.tsx           # Sign in / sign up
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state management
│   │   └── ThemeContext.tsx   # Light/dark theme
│   ├── components/            # Navbar, Hero, About, Portfolio, Contact, etc.
│   └── lib/                   # API helpers, upload utilities
│
├── profiles/                  # Sample profile JSON files
├── requirements.txt           # Python dependencies
├── package.json               # Node dependencies
├── vite.config.ts             # Vite config (proxy /api → backend)
├── .env.sample                # Environment variable template
└── architecture.svg           # Architecture diagram
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager) or pip
- A [Mistral AI](https://console.mistral.ai/) API key
- An [ElevenLabs](https://elevenlabs.io/) API key
- A [Supabase](https://supabase.com/) project (with pgvector enabled)

### 1. Clone and configure

```bash
git clone https://github.com/<your-org>/Mistral-Hackathon.git
cd Mistral-Hackathon
cp .env.sample .env
```

Fill in your `.env`:

```env
MISTRAL_API_KEY=your_mistral_key
ELEVENLABS_API_KEY=your_elevenlabs_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key
JWT_SECRET=a_random_secret_string
```

### 2. Set up the database

Run the following in the Supabase SQL editor:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table
CREATE TABLE profiles (
    id   TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    embedding vector(1024)
);

-- Users table
CREATE TABLE users (
    username        TEXT PRIMARY KEY,
    hashed_password TEXT NOT NULL
);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_profiles(
    query_embedding vector(1024),
    match_threshold float,
    match_count int
)
RETURNS TABLE (id text, data jsonb, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.data,
           1 - (p.embedding <=> query_embedding) AS similarity
    FROM profiles p
    WHERE p.embedding IS NOT NULL
      AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### 3. Start the backend

```bash
# Option A: with uv
uv sync
uv run main.py

# Option B: with pip
pip install -r requirements.txt
python main.py
```

Backend runs at **http://localhost:8000**. Verify with:

```bash
curl http://localhost:8000/health
# → {"status":"healthy","service":"mistral-hackathon-api"}
```

### 4. Start the frontend

```bash
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (proxies `/api` requests to the backend).

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Log in and receive JWT |
| `GET` | `/auth/me` | Get current user (requires JWT) |
| `GET` | `/profiles` | List all profiles |
| `POST` | `/profiles` | Create a new profile |
| `GET` | `/profile/{id}` | Get a single profile |
| `PUT` | `/profile/{id}` | Update a profile |
| `POST` | `/profile/{id}/parse-cv` | Upload PDF, run OCR + structured parsing |
| `GET` | `/search?q=...` | Keyword search across profiles |
| `GET` | `/deep-search?q=...` | Semantic similarity search (embeddings) |
| `POST` | `/profile/{id}/clone-voice` | Upload audio sample, create voice clone |
| `DELETE` | `/profile/{id}/voice` | Delete cloned voice |
| `POST` | `/profile/{id}/chat` | Voice chat (audio in, audio + text out) |
| `POST` | `/profile/{id}/chat/text` | Text chat (text in, audio + text out) |
| `GET` | `/health` | Health check |

---

## Deployment

| Component | Hosted On | URL |
|-----------|-----------|-----|
| Frontend | Vercel | [askmestral.vercel.app](https://askmestral.vercel.app) |
| Backend | Render | tzikos-website.onrender.com |
| Database | Supabase | Managed PostgreSQL + pgvector |

To deploy your own:

- **Frontend**: Push to GitHub and connect to Vercel. Set `VITE_API_URL` to your backend URL.
- **Backend**: Deploy to Render (or any Docker/ASGI host). Set all env vars from `.env.sample`.

---

## Tech Stack Summary

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic |
| **AI / ML** | Mistral OCR, Mistral Large, Mistral Small, Mistral Embed, Voxtral Mini |
| **Voice** | ElevenLabs (voice cloning + TTS) |
| **Database** | Supabase (PostgreSQL, JSONB, pgvector) |
| **Auth** | bcrypt, python-jose (JWT) |

---

## Team
**Tirokafteri**
- Dimitris Papantzikos
- Michail Dikaiopoulos
- Xhino Mullaymeri

Built for the **Mistral AI Hackathon**.

---

This project was built during a (weekend) hackathon.
Thanks to Mistral AI for providing the models and ElevenLabs for providing the voice cloning API 
and the rest of sponsors for facilitating the hackathon.