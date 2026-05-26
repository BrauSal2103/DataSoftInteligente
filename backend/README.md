# Backend for Semantic PictoEval

This folder contains a minimal FastAPI server that exposes endpoints used by the frontend.

Run (from repository root):

```bash
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Endpoints:
- POST `/api/datasets/upload` — multipart `file` (returns `sessionId`)
- GET `/api/examples`?sessionId=... — list converted examples
- POST `/api/examples/{id}/metrics`?sessionId=... — compute metrics for an example and store under `backend/data/{sessionId}/metrics`
- POST `/api/examples/{id}/llm-judge`?sessionId=... — run LLM-Judge (stub if no GEMINI_API_KEY)
- GET `/api/progress` — progress summary

Outputs by session are stored under `backend/data/{sessionId}/...` so switching metrics or re-running does not overwrite previous results.
