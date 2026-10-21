# Multi-Vendor Job Board & Application Portal (HireSphere)

A complete, functional, responsive, and production-oriented **Multi-Vendor Job Board & Application Portal** built with **Django REST Framework**, **React.js with Vite**, **Tailwind CSS**, and **PostgreSQL**.

---

## 1. System Architecture & Features

### Core Concept & User Roles
The platform operates as a multi-tenant recruitment ecosystem where multiple companies can independently register, publish job openings, and manage candidate pipelines.

Three distinct roles are enforced via role-based access control (RBAC):

1. **Candidate (Job Seeker)**
   - Candidate profile: headline, summary, skills tags, experience, education, preferred work mode, salary expectation, and portfolio links.
   - **Secure Resume Vault:** Upload PDF/DOCX resumes (validated via file headers and extensions, max 5MB). Designate primary resumes.
   - **Job Discovery:** Server-side search & filtering across title, description, skills, company name, work mode (Remote/Hybrid/On-site), employment type, experience level, and salary.
   - **Application Tracking:** Apply with one click using an existing resume or upload on the fly with a cover letter. Prevent duplicate applications to the same opening.
   - **Audit Timeline:** View status changes (`Applied` → `Under Review` → `Shortlisted` → `Interview Scheduled` → `Offered` / `Rejected`). Ability to withdraw applications.

2. **Recruiter / Employer**
   - **Company Management:** Create and edit company profile (name, logo, website, industry, headquarters, size, and culture overview).
   - **Job Management:** Post, edit, publish, pause, or archive job openings with detailed responsibilities, requirements, and required skills.
   - **Applicant Pipeline:** Filter candidates by job opening, review stage, and skills.
   - **Secure Resume Downloads:** Recruiters are authorized to download resumes **only** for candidates who applied to their company's jobs.
   - **Status Transitions & Audit History:** Progress candidate stages with audit feedback notes.
   - **Private Recruiter Notes:** Internal discussion thread for company recruiters. Private notes are **never** exposed to candidates.

3. **Administrator**
   - Platform metrics: Total users, candidates, recruiters, companies, active jobs, and applications.
   - **User Moderation:** Audit candidate and recruiter accounts; activate or suspend accounts.
   - **Company Verification:** Review company credentials and toggle verified employer badges.
   - **Job Moderation:** Moderate or archive inappropriate job postings across all vendors.
   - Interactive React Admin Dashboard + Django Admin at `/admin/`.

---

## 2. Technology Stack

- **Frontend:** React.js (v19) with Vite, Tailwind CSS, Lucide icons, React Router DOM (v6), Axios with automatic JWT refresh interceptor.
- **Backend:** Python 3.12, Django 5, Django REST Framework, SimpleJWT, django-filter, WhiteNoise, drf-spectacular.
- **Database:** PostgreSQL 16 (with automatic SQLite fallback for isolated local test runs; strictly disallows SQLite fallback in production).
- **API Documentation:** Swagger UI & ReDoc via `drf-spectacular` OpenAPI 3.0.
- **Containerization:** Docker, Dockerfile (multi-stage for React/Nginx), and Docker Compose.

---

## 3. Pre-Configured Demo Accounts

For immediate evaluation, the database can be seeded with realistic sample accounts and jobs using `python manage.py seed_data`:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `AdminPass123!` | Eleanor Vance (Platform Admin) |
| **Recruiter 1** | `recruiter1@acme.com` | `RecruiterPass123!` | Marcus Brody (Acme Cloud Systems) |
| **Recruiter 2** | `recruiter2@technova.com` | `RecruiterPass123!` | Elena Rostova (TechNova AI) |
| **Recruiter 3** | `recruiter3@pulse.io` | `RecruiterPass123!` | Julian Sterling (Pulse Health Tech) |
| **Candidate 1** | `candidate1@example.com` | `CandidatePass123!` | Alex Rivera (Full Stack Engineer) |
| **Candidate 2** | `candidate2@example.com` | `CandidatePass123!` | Sarah Chen (Product Designer) |
| **Candidate 3** | `candidate3@example.com` | `CandidatePass123!` | David Miller (DevOps / SRE) |

> **Tip:** The frontend login page and navigation bar include a **"1-Click Demo Logins"** shortcut to switch personas instantly without manual typing.

---

## 4. Local Development Setup (Without Docker)

### Prerequisites:
- Python 3.12+
- Node.js 20+ and npm

### Backend Setup:
```bash
cd multivendor-job-board

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
python backend/manage.py migrate

# Seed demonstration data
python backend/manage.py seed_data

# Start the Django development server
python backend/manage.py runserver 8000
```
Backend API will be running at `http://localhost:8000`.

### Frontend Setup:
```bash
cd multivendor-job-board/frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## 5. Automated Test Suites & Live Verification

The application includes both unit/integration tests and live API verification:

```bash
cd multivendor-job-board

# 1. Run pytest suite (18 tests covering auth, RBAC, cross-company data isolation, status guards)
pytest backend/tests -v

# 2. Run live HTTP verification harness against running local server (24 end-to-end checks)
python backend/tests/verify_live_api.py

# 3. Run production build check on frontend
cd frontend
npm run build
```

---

## 6. Production Security Architecture

The codebase contains strict defense-in-depth protections designed for zero-trust multi-tenancy:

1. **Strict Production Environment Guards:**
   - When `DEBUG=False`, Django **refuses to boot** if using the default insecure `SECRET_KEY`.
   - When `DEBUG=False`, wildcard `ALLOWED_HOSTS='*'` is forbidden.
   - When `DEBUG=False`, **silent fallback to SQLite is strictly disabled**. If PostgreSQL or `DATABASE_URL` is not provided, Django aborts with a descriptive error.
2. **Secure HTTPS & Cookie Headers:**
   - `SESSION_COOKIE_SECURE = True`
   - `CSRF_COOKIE_SECURE = True`
   - `SESSION_COOKIE_HTTPONLY = True`
   - `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`
   - `SECURE_HSTS_SECONDS = 31536000` (HTTP Strict Transport Security with preload and subdomains enabled).
3. **Resume Storage & Download Access Control:**
   - Resumes are validated via file extension (`.pdf`, `.docx`) and magic bytes (`%PDF-`, `PK\x03\x04`).
   - Files are stored using obfuscated UUID filenames (`media/resumes/{user_id}/{uuid}.pdf`).
   - Nginx explicitly blocks direct public access (`location /media/resumes/ { deny all; return 403; }`).
   - Resumes can **only** be downloaded through the authenticated endpoint `/api/candidates/resumes/<id>/download/`, which authorizes only the candidate owner, recruiters of companies the candidate has applied to, or platform administrators.
4. **Cross-Company Recruiter Isolation:**
   - Recruiter endpoints strictly filter querysets by `job__company=request.user.recruiter_profile.company`.
   - Directly requesting an application or note from another company raises `HTTP 404 Not Found` rather than empty lists or data leakage.

---

## 7. Production Environment Variables Reference

| Variable | Default (Dev) | Production Requirement | Description |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | `production` | Defines operational mode. |
| `DEBUG` | `True` | `False` | Disables debug tracebacks and secret exposure. |
| `SECRET_KEY` | `django-insecure-...` | **Strong Random Key** | Cryptographic key for signing sessions and JWTs. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | `yourdomain.com,api.yourdomain.com` | Whitelist of valid Host header domains. |
| `DB_ENGINE` | `django.db.backends.postgresql` | `django.db.backends.postgresql` | Database driver (PostgreSQL required in prod). |
| `DATABASE_URL` | *(None)* | `postgres://user:pass@host:5432/db` | Alternative connection string format. |
| `DB_NAME` | `jobboard_db` | `jobboard_db` | PostgreSQL database name. |
| `DB_USER` | `jobboard_user` | `jobboard_user` | PostgreSQL username. |
| `DB_PASSWORD` | *(Dev default)* | **Strong Password** | PostgreSQL user password. |
| `DB_HOST` | `localhost` | `db` (or managed DB host) | PostgreSQL host. |
| `DB_PORT` | `5432` | `5432` | PostgreSQL port. |
| `DB_CONN_MAX_AGE` | `600` | `600` | Persistent DB connection timeout (seconds). |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...` | `https://yourdomain.com` | Permitted browser origins for cross-origin requests. |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:5173,...` | `https://yourdomain.com` | Trusted origins for CSRF protection. |
| `SECURE_SSL_REDIRECT` | `False` | `True` | Redirects plain HTTP to HTTPS. |
| `SEED_DEMO_DATA` | `False` | `False` | Inserts mock data on startup if `True`. |
| `MAX_RESUME_SIZE_MB` | `5` | `5` | Maximum upload size for candidate resumes. |
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | `/api` | Base API URL baked into React bundle during build. |

---

## 8. Docker Compose Deployment (Recommended for VPS)

### Prerequisites:
- A server with Docker 24+ and Docker Compose installed.

### Setup & Launch:
```bash
# 1. Clone the repository on your server
git clone <your-repo-url> multivendor-job-board
cd multivendor-job-board

# 2. Create production .env file
cp .env.example .env
# Edit .env and configure strong passwords, domain, and DEBUG=False:
nano .env

# 3. Launch container stack
docker compose up --build -d

# 4. Verify running containers
docker compose ps
```

### Container Architecture:
- `jobboard_postgres`: PostgreSQL 16 Alpine with health check and isolated Docker volume `postgres_data`. Database port bound to `127.0.0.1:5432` for security.
- `jobboard_backend`: Python 3.12 running Gunicorn (3 workers), WhiteNoise static asset serving, and automatic migrations via `docker-entrypoint.sh`.
- `jobboard_frontend`: Nginx Alpine serving optimized React production build, routing SPA routes, and reverse proxying `/api/` and `/admin/` to Gunicorn.

---

## 9. Solo Developer Deployment Architecture & Hosting Recommendation

For a solo developer prioritizing ease of maintenance, cost efficiency, and zero maintenance overhead, two practical paths exist:

### Option A: Single VPS with Docker Compose & Caddy (Recommended)
- **Host:** Hetzner Cloud (CX22 ~€4/month) or DigitalOcean Droplet ($6/month, 1GB-2GB RAM).
- **Reverse Proxy / SSL:** Add a lightweight Caddy container or host Nginx with automated Let's Encrypt SSL.
- **Why it fits a solo developer:**
  - Complete control: Postgres, Django, and React run on the same virtual network with lowest possible network latency.
  - Predictable, flat monthly pricing ($4 - $6/month total).
  - No cold starts or memory limit throttling compared to free serverless tiers.

### Option B: Managed PaaS (Render / Railway) + Vercel Frontend + Managed DB
- **Frontend:** Vercel or Cloudflare Pages (Free tier).
- **Backend:** Render Web Service ($7/month) or Railway ($5/month).
- **Database:** Neon PostgreSQL (Free tier / $19/month) or Supabase.
- **Why it fits:** Zero server maintenance, automated Git push deployments, and managed database backups.

---

## 10. Database Administration & Backup Procedures

### Initializing a Secure Administrator Account:
```bash
# Inside Docker:
docker compose exec backend python manage.py createsuperuser

# On direct host:
python backend/manage.py createsuperuser
```

### Automated Database Backup (PostgreSQL):
Create a nightly backup script (`backup.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/jobboard"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/jobboard_db_$TIMESTAMP.sql.gz"

# Export dump via Docker
docker compose exec -T db pg_dump -U jobboard_user jobboard_db | gzip > "$FILENAME"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +14 -exec rm {} \;
echo "Backup completed: $FILENAME"
```
Schedule via `crontab -e`:
```text
0 2 * * * /bin/bash /path/to/backup.sh >> /var/log/jobboard_backup.log 2>&1
```

### Restoring from Backup:
```bash
gunzip -c /var/backups/jobboard/jobboard_db_YYYYMMDD_HHMMSS.sql.gz | \
docker compose exec -T db psql -U jobboard_user -d jobboard_db
```

---

## 11. Troubleshooting Common Issues

1. **Database Connection Refused:**
   - Check if PostgreSQL is running: `docker compose ps`
   - Verify network health: `docker compose logs db`
   - Check DB port binding: Ensure `DB_HOST=db` inside Docker, or `localhost` when running outside Docker.
2. **Nginx 413 (Payload Too Large):**
   - Nginx `client_max_body_size` is configured to `10M` in `frontend/nginx.conf`. If you customize Nginx, ensure this directive is set.
3. **CORS / CSRF Header Errors:**
   - Ensure `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in `.env` include your exact frontend domain including the protocol (`https://yourdomain.com`).
4. **Django Admin CSS Missing:**
   - Run `python manage.py collectstatic --noinput`.
   - WhiteNoise is enabled in `settings.py` and serves static files automatically. Ensure `STATIC_ROOT` has read permissions.
