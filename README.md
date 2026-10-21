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
- **Backend:** Python 3.12, Django 5, Django REST Framework, SimpleJWT, django-filter.
- **Database:** PostgreSQL (with automatic SQLite fallback for local test runs).
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

## 4. Quickstart with Docker Compose

To build and run the entire stack (PostgreSQL, Django API, Nginx React Frontend):

```bash
# 1. Clone or navigate to the project directory
cd multivendor-job-board

# 2. Copy the sample environment file
cp .env.example .env

# 3. Launch the containerized application
docker compose up --build -d
```

### Services & Endpoints:
- **Frontend Portal:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:8000/api/`
- **Swagger OpenAPI Docs:** `http://localhost:8000/api/docs/`
- **ReDoc API Documentation:** `http://localhost:8000/api/redoc/`
- **Django Admin Portal:** `http://localhost:8000/admin/`

To shut down the containers:
```bash
docker compose down
```

---

## 5. Local Development Setup (Without Docker)

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

## 6. Running Automated Tests

A comprehensive test suite covers authentication, role permissions, cross-company data isolation, duplicate application prevention, resume download access control, and status transitions:

```bash
cd multivendor-job-board

# Run pytest inside virtual environment
pytest backend/tests
```

To run frontend build checks:
```bash
cd multivendor-job-board/frontend
npm run build
```

---

## 7. Resume Upload Security & Access Control

Resume storage implements defense-in-depth protections:
1. **Extension & Header Validation:** Uploads are restricted strictly to `.pdf` and `.docx`. Header signatures (`%PDF` and `PK\x03\x04`) are inspected to prevent executable masquerading.
2. **Randomized File Names:** Uploaded files are stored under non-guessable paths (`resumes/{user_id}/{uuid}.pdf`) to block directory traversal and filename collisions.
3. **Private File Serving:** Files are located outside public static directories. All downloads route through `/api/candidates/resumes/<id>/download/`, which enforces authorization:
   - Candidate owner → Allowed
   - Recruiter of a company where candidate applied with this resume → Allowed
   - Platform Administrator → Allowed
   - Any other user → Returns **HTTP 403 Forbidden**.

---

## 8. Production Deployment Notes

For production deployments:
- **Environment Variables:** Set `DEBUG=False`, generate a cryptographically strong `SECRET_KEY`, and set explicit `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- **Database:** Use managed PostgreSQL (AWS RDS, Google Cloud SQL, or Supabase).
- **HTTPS & Cookies:** Enforce SSL with `SECURE_SSL_REDIRECT = True`, `SESSION_COOKIE_SECURE = True`, and `CSRF_COOKIE_SECURE = True`.
- **Cloud Media Storage:** For scale, replace local media storage with `django-storages` + AWS S3 / Google Cloud Storage with private pre-signed URLs.
- **Process Manager:** Use Gunicorn with Uvicorn workers behind an Nginx reverse proxy.
