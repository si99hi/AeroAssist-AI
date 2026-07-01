# AeroAssist AI

AI-powered airline operations assistant demonstrating MCP, LangChain, LangGraph, RAG, FastAPI, React, FAISS, and JWT authentication.

## Screenshots

### Login / Authentication
![Landing Page](assets/Screenshot%202026-07-01%20204857.png)

### Chat Interface
![Login](assets/Screenshot%202026-07-01%20205105.png)

![Dashboard](assets/Screenshot%202026-07-01%20205152.png)

### Telemetry
![Chat Interface](assets/Screenshot%202026-07-01%20205159.png)

### Add files
![files](assets/Screenshot%202026-07-01%20212554.png)

## Architecture

```
React Frontend (Vite + TypeScript + Tailwind)
        │
FastAPI Backend
        │
LangGraph Agent (Gemini) ──fallback──► Keyword Router
        │
   ┌────┴────┬────────────┐
   │         │            │
Flight    Weather    Policy Search
 Tool      Tool         Tool
                       │
                  FAISS + BGE Embeddings
                       │
              United Policy Documents
```

## Features (MVP)

- Chat interface with suggested questions
- Flight status tool (mock + AviationStack when API key set)
- Weather tool (mock + OpenWeather when API key set)
- Policy search via FAISS RAG with citations
- LangGraph agent with Gemini (keyword fallback without API key)
- MCP server exposing all three tools
- JWT authentication + chat history in PostgreSQL/SQLite
- Admin document upload + index rebuild
- Analytics dashboard (tool usage, latency)
- Docker Compose for local deployment

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Edit .env — add GEMINI_API_KEY for LLM agent (optional)
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install --upgrade pip
pip install --no-compile -r requirements.txt   # --no-compile avoids a Windows pip bug
set PYTHONPATH=%CD%            # Windows — required so `app` package is found
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — register an account, then chat.

### 4. Tests

```bash
cd backend
python -m tests.test_agent
```

### 5. MCP Server (standalone)

```bash
cd backend
python -m app.mcp.server
```

### 6. Docker

```bash
docker compose up --build
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/chat` | List chat history |
| POST | `/chat` | Send message (auth required) |
| POST | `/chat/public` | Send message (no auth, for testing) |
| POST | `/documents/upload` | Upload policy PDF |
| GET | `/documents` | List documents |
| DELETE | `/documents/{id}` | Delete document |
| POST | `/documents/rebuild` | Rebuild FAISS index |
| GET | `/analytics` | Tool usage stats |

## Troubleshooting install (Windows)

If `pip install` appears stuck or fails with `AssertionError` during install:

1. **Kill stuck Python processes** — a failed install can lock `.venv` files
2. **Delete and recreate the venv**: `rmdir /s /q .venv` then `python -m venv .venv`
3. **Use `--no-compile`** — avoids a known Windows pip bug when writing `.pyc` files
4. **We use `fastembed` instead of `sentence-transformers`** — the latter pulls PyTorch (~500MB+) and often hangs silently on Windows

```bash
pip install --no-compile -r requirements.txt
```

First run downloads the embedding model (~30MB) from HuggingFace — this is normal.

## Database

Uses **SQLite** locally by default. For **Neon PostgreSQL**, set in `.env`:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## What you need to provide

| Key | Required? | Purpose |
|-----|-----------|---------|
| `GEMINI_API_KEY` | Optional | Enables LangGraph LLM agent (free tier available) |
| `OPENWEATHER_API_KEY` | Optional | Real weather data (mocks used otherwise) |
| `AVIATIONSTACK_API_KEY` | Optional | Real flight data (mocks used otherwise) |
| `DATABASE_URL` | Optional | Neon PostgreSQL (SQLite used otherwise) |
| `SECRET_KEY` | Recommended | JWT signing — change before deploy |

## Try these questions

- "Why is UA451 delayed?" → flight status + weather
- "Can I carry two bags?" → policy search with citations
- "What is the weather at SFO?" → weather only
- "Can I rebook after cancellation on UA100?" → flight + policy

## Project Structure

```
aeroassist-ai/
├── frontend/          React + Vite + TypeScript + Tailwind
├── backend/
│   └── app/
│       ├── api/       FastAPI routes
│       ├── agents/    LangGraph + fallback agent
│       ├── mcp/       MCP server
│       ├── rag/       FAISS retriever
│       ├── auth/      JWT + bcrypt
│       └── models/    SQLAlchemy models
├── documents/         Sample United policy docs
├── faiss/             Vector index (auto-generated)
├── scripts/           build_index.py
├── docker/            Dockerfiles
└── docker-compose.yml
```

## MVP Checklist

- [x] FastAPI backend running
- [x] React frontend running
- [x] User authentication
- [x] Upload airline policy documents
- [x] Generate embeddings (BAAI/bge-small-en-v1.5)
- [x] Store vectors in FAISS
- [x] `search_policy()` tool
- [x] `get_flight_status()` tool
- [x] `check_weather()` tool
- [x] MCP server exposing all tools
- [x] LangGraph agent to select tools
- [x] Chat interface
- [x] Citations in RAG answers
- [x] Chat history in database
- [x] Dockerize application
- [ ] Deploy frontend and backend (Vercel + Render — see deploy section below)
- [x] README with architecture

## Deployment Notes

**Frontend (Vercel):** Set `VITE_API_URL` to your Render backend URL.

**Backend (Render):** Set env vars from `.env.example`. Mount `faiss/` or rebuild index on startup.

**Database (Neon):** Create free PostgreSQL, paste connection string as `DATABASE_URL`.
