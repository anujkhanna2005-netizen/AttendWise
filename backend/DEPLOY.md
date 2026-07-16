# AttendWise ERP — Backend Deployment Guide

## Local development

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# 2. Install dependencies (psycopg2-binary installs via binary wheel)
pip install --only-binary=:all: psycopg2-binary
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# 4. Run migrations
alembic upgrade head

# 5. Seed base roles + admin account
python -m app.database.seed

# 6. Start development server
uvicorn main:app --reload
# API docs available at: http://localhost:8000/docs
```

## Railway deployment

1. Push the `backend/` folder to a new Railway project (or connect this repo and set the root to `backend/`).
2. Add the following **environment variables** in Railway → Variables:
   - `DATABASE_URL` — paste from Railway PostgreSQL plugin
   - `JWT_SECRET` — generate: `python -c "import secrets; print(secrets.token_hex(64))"`
   - `CORS_ORIGINS` — `https://attendwise-app.web.app` (comma-separate if needed)
   - `SEED_ADMIN_PASSWORD` / `SEED_FACULTY_PASSWORD` — set secure values
3. Railway auto-detects the `Dockerfile`. The container CMD runs `alembic upgrade head && uvicorn main:app ...`
4. After first deploy, trigger the seed: open Railway shell → `python -m app.database.seed`
5. Verify: `curl https://<your-railway-url>/health`

## Render deployment

1. New Render Web Service → connect repo → Root Directory: `backend`
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (same as Railway above).
5. Add a PostgreSQL database in Render and copy the connection string to `DATABASE_URL`.

## Verification checklist (Phase 0)

Run these commands against the **live deployed URL** — not localhost:

```bash
BASE=https://<your-deployed-url>

# 1. Health check
curl $BASE/health
# Expected: {"status":"ok","db_connected":true,"version":"0.1.0"}

# 2. Register a student
curl -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass1","role":"student","roll_number":"CS001","department_id":1}'

# 3. Login
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@attendwise.local","password":"<your_seed_admin_password>"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 4. Role check — student token trying to create a department → must return 403
STUDENT_TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"testpass1"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -X POST $BASE/departments \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Engineering","code":"ENG"}'
# Expected: 403 Forbidden

# 5. Create a department as admin, then try to create another with same code → 409
curl -X POST $BASE/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Computer Science","code":"CS"}'

curl -X POST $BASE/departments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Duplicate","code":"CS"}'
# Expected: 409 Conflict

# 6. ON DELETE RESTRICT test — attempt to delete a department that has a student
# (assuming dept id=1 has student CS001 assigned)
curl -X DELETE $BASE/departments/1 \
  -H "Authorization: Bearer $TOKEN"
# Expected: 409 Conflict with message about ON DELETE RESTRICT
```
