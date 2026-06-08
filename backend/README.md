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
- POST `/api/examples/{id}/llm-judge`?sessionId=...&modelKey=modelo_1 — run LLM-Judge with Gemini
- POST `/api/examples/{id}/human-evaluation` — save human Likert scores and comment for one model prediction
- GET `/api/human-evaluations`?sessionId=... — list human evaluations for a session
- GET `/api/examples/{id}/human-evaluation`?sessionId=...&modelKey=modelo_1 — get one human evaluation
- GET `/api/progress` — progress summary

Outputs by session are stored under `backend/data/{sessionId}/...` so switching metrics or re-running does not overwrite previous results.

Human evaluations are stored temporarily as JSON files under:

```txt
backend/data/{sessionId}/human_evaluations/example_{exampleId}_{modelKey}.json
```

Example body:

```json
{
  "sessionId": "abc123",
  "modelKey": "modelo_1",
  "semanticScore": 4,
  "clarityScore": 3,
  "comment": "Se entiende la acción principal, pero falta un concepto importante."
}
```

Database migration scripts are prepared in `backend/sql/`, but the backend still uses file persistence for now.

Gemini is called through the backend using `GEMINI_API_KEY` from the environment or a local `.env` file.
