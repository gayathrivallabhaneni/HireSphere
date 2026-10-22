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

## 9. Managed Cloud Deployment & Hosting Guide

For a solo developer prioritizing ease of maintenance, cost efficiency, and zero operational toil, this section outlines the recommended managed cloud architectures, pricing models, caveats, and step-by-step setup.

### 9.1 Hosting Provider Comparison for Solo Developers

| Hosting Architecture | Typical Monthly Cost | Cold Starts? | Database Persistence | Resume Storage Strategy | Solo Dev Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Render (Full-Stack PaaS)**<br>*(Recommended PaaS)* | **\$14 / mo**<br>($7 Web + $7 Postgres + Free Static Frontend) | **No** on paid tiers<br>*(Free tier spins down after 15m)* | **Persistent** on Starter plan ($7/mo).<br>*(Free DB deleted after 30 days)* | Mount 1GB Persistent Disk ($0.25/mo) or Cloudflare R2 | **Top PaaS Pick:** Simplest setup via included `render.yaml` blueprint. |
| **Railway (Full-Stack PaaS)** | **\$5 – \$15 / mo**<br>(Usage-based: CPU/RAM metrics) | **No** | Persistent Volume attached to service. | Mount persistent volume or S3/R2 | **Very Good:** Developer-friendly CLI, but usage-based pricing can fluctuate. |
| **Single VPS (Hetzner / DigitalOcean)**<br>*(Most Cost-Effective)* | **\$4 – \$6 / mo**<br>(€3.79 Hetzner CX22 / $6 DO) | **No** | Persistent Docker volume on host SSD. | Local directory `media/resumes/` on server SSD | **Top Value Pick:** Lowest flat cost, highest memory/CPU per dollar, full architectural control. |
| **Split: Vercel (Frontend) + Render/Fly (Backend)** | **\$7 – \$10 / mo**<br>(Free Vercel + $7 Backend + Neon DB) | No on paid backend | Managed DB (Neon free tier or Render) | Cloudflare R2 or AWS S3 required | **Good for CDN:** Global React CDN edge; requires cross-origin CORS/CSRF configuration. |

> [!CAUTION]
> **Free-Tier Traps to Avoid in Production:**
> 1. **Render Free Web Services:** Spin down after 15 minutes of inactivity, introducing 30–50 second cold start latency for users and search crawlers.
> 2. **Render Free PostgreSQL:** Automatically **expires and is deleted after 30 days**. Production deployments must use at least the Starter tier ($7/mo) for persistent data.
> 3. **Ephemeral Container Storage:** Managed container platforms (Render, Railway, Fly, Heroku) destroy local disk files on every redeploy or restart. Resumes uploaded to `media/resumes/` will be lost unless you attach a **Persistent Disk** or configure **Cloudflare R2 / AWS S3**.

---

### 9.2 Recommended Managed Deployment: Render via Infrastructure Blueprint

HireSphere includes a production-ready Render Blueprint specification ([render.yaml](file:///C:/Users/gayat/.gemini/antigravity/scratch/multivendor-job-board/render.yaml)) and build script ([render_build.sh](file:///C:/Users/gayat/.gemini/antigravity/scratch/multivendor-job-board/render_build.sh)).

#### Step 1: Push Repository to GitHub
Ensure your repository is pushed to your private or public GitHub account.

#### Step 2: Deploy Blueprint on Render
1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository `multivendor-job-board`.
4. Render will detect `render.yaml` and configure:
   - `hiresphere-db`: Managed PostgreSQL database (Starter plan).
   - `hiresphere-api`: Django Web Service with Python 3.12, Gunicorn, auto-migrations, and static collection.
   - `hiresphere-frontend`: React static site with SPA routing rewrites.
5. Click **Apply**.

#### Step 3: Configure Cross-Origin Environment Variables
Once Render assigns URLs (e.g., `https://hiresphere-frontend.onrender.com` and `https://hiresphere-api.onrender.com`):
1. In `hiresphere-frontend` settings:
   - Set `VITE_API_BASE_URL` = `https://hiresphere-api.onrender.com/api`
2. In `hiresphere-api` settings:
   - Set `CORS_ALLOWED_ORIGINS` = `https://hiresphere-frontend.onrender.com`
   - Set `CSRF_TRUSTED_ORIGINS` = `https://hiresphere-frontend.onrender.com`
   - Set `ALLOWED_HOSTS` = `hiresphere-api.onrender.com,.onrender.com`

---

### 9.3 Persistent Resume Storage Options

Choose either Option A or Option B for handling candidate resume uploads in the cloud:

#### Option A: Render Persistent Disk (Easiest — No AWS Account Needed)
1. Go to `hiresphere-api` in Render Dashboard → **Disks** → **Add Disk**.
2. Set Mount Path: `/opt/render/project/src/backend/media` (or mount at persistent directory).
3. Size: 1 GB ($0.25/month).
4. No extra environment variables needed; files persist across redeployments on disk.

#### Option B: Cloudflare R2 or AWS S3 (Scale-Out & Zero Egress Fees)
HireSphere includes built-in `django-storages` with Boto3. To store resumes in an S3-compatible bucket:
1. Create a private bucket in **Cloudflare R2** (10GB free storage, $0 egress fees) or **AWS S3**.
2. Add the following environment variables to your backend service:
   ```env
   USE_S3=True
   AWS_STORAGE_BUCKET_NAME=your-bucket-name
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_S3_REGION_NAME=auto
   AWS_S3_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
   ```
3. Resume downloads will continue to be streamed securely through `/api/candidates/resumes/<id>/download/` with full role verification.

---

### 9.4 Production Database Initialization & Administrator Setup

1. **Automatic Migrations:** `render_build.sh` automatically runs `python backend/manage.py migrate --noinput` on every deploy.
2. **Demo Data Policy:** By default, `SEED_DEMO_DATA=False` in production. Demo accounts will **not** be seeded unless explicitly requested.
3. **Creating the First Production Administrator:**
   In Render Dashboard → Select `hiresphere-api` → Click **Shell** (SSH web console):
   ```bash
   python backend/manage.py createsuperuser
   ```
   Follow the prompts to enter your secure administrator email and password. Log in at `https://hiresphere-frontend.onrender.com/login` or `https://hiresphere-api.onrender.com/admin/`.

---

### 9.5 Production Pre-Flight Checklist

Before opening the portal to real candidates and employers:

- [ ] `DEBUG` is set to `False` on the backend service.
- [ ] `SECRET_KEY` is a unique, random string of 50+ characters (not the default string).
- [ ] `ALLOWED_HOSTS` includes only your specific frontend and API domains (no `*`).
- [ ] `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` match the frontend domain with `https://`.
- [ ] Database is PostgreSQL (confirmed by running `manage.py check`).
- [ ] Resumes persist across restarts (verified via Persistent Disk or S3/R2).
- [ ] Administrator account created via `createsuperuser`.
- [ ] Custom domain DNS (e.g. `cname.onrender.com`) configured with automated SSL.
- [ ] Swagger / OpenAPI documentation is accessible at `/api/docs/`.

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
