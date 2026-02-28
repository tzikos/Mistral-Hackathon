# Mistral Hackathon - AI Personal Profile Platform

## Current Project Structure

```
Mistral-Hackathon/
├── .gitignore
├── .python-version
├── README.md
├── check_mistral_api.py      # Python API endpoint checker
├── main.py                   # Main Python backend
├── pyproject.toml            # Python project config
├── uv.lock                   # Python dependencies
│
├── # Frontend (Vite + React + TypeScript)
├── index.html
├── package-lock.json
├── package.json
├── vite.config.ts
├── tsconfig.app.json
├── tsconfig.node.json
├── public/                   # Static assets
├── src/                      # React components
├── api/                      # Local API routes
├── components.json
├── eslint.config.js
├── postcss.config.js
├── server.js
├── tailwind.config.ts
└── .env                       # Environment variables
```

## 🚀 Quick Start - Local Development

### 1. Frontend (React + Vite)
```bash
npm install
npm run dev
```
- 🌐 Frontend runs on: `http://localhost:5173`
- ✨ Hot reloading enabled

### 2. Backend (FastAPI)
```bash
# Install dependencies
uv sync

# Start development server
uv run main.py
```
- 🌐 Backend runs on: `http://localhost:8000`
- ✨ Auto-reload enabled
- 🔄 CORS configured for frontend

### 3. Test the API
```bash
# Health check
curl http://localhost:8000/health

# Get sample profile
curl http://localhost:8000/profile/test123

# Chat endpoint (POST)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from frontend!"}'
```

## Key Features to Implement

### Platform Component (Your Focus)
1. **User Profile Management**
   - Profile creation/editing interface
   - CV upload and parsing
   - Work experience timeline
   - Skills and education sections

2. **AI Agent Integration**
   - Profile data → AI agent training
   - Conversational interface for recruiters
   - Session management

3. **Frontend Pages**
   - Public profile view
   - Admin dashboard
   - Chat interface
   - Analytics dashboard

4. **Database Design**
   - User profiles collection
   - Conversation logs
   - Media storage

### AI Component (Separate Focus)
- Agent training optimization
- Conversation quality improvement
- Context management
- Response generation

## Current Status

✅ Frontend: Vite+React+TypeScript with shadcn-ui
✅ Backend: Basic Python structure
✅ AWS Lambda: Chatbot integration ready
⚠️ Profile Management: Needs implementation
⚠️ AI Training Pipeline: Needs implementation

## Next Steps

1. **Implement profile data structure** in `src/services/`
2. **Create profile pages** in `src/pages/`
3. **Set up API endpoints** in `api/`
4. **Connect to database** (Supabase/Firebase/your choice)

Would you like me to help with any specific part of the platform implementation?
