# Land Acquisition Predictive System

Monorepo scaffold for a land-acquisition risk and cost prediction platform.

## Services

- `frontend/` - reserved for the React + Vite client.
- `backend/` - FastAPI application and domain API.
- `ml-service/` - prediction microservice boundary.
- `database/` - PostgreSQL/PostGIS initialization and backups.
- `cpp-engine/` - optional native feature-engineering module.

## Run the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API health endpoint is available at `http://localhost:8000/health`.

