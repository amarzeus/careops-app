# CareOps FastAPI Backend

This is the initial FastAPI scaffold for the hybrid CareOps architecture.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/health` for the health check.
