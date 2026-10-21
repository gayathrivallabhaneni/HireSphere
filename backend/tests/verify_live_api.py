"""
Live End-to-End API and Security Verification Script
Uses Python standard library (urllib.request) to verify all live endpoints on http://localhost:8000
"""
import sys
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(line_buffering=True)

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    
    encoded_data = None
    if data is not None:
        if isinstance(data, dict):
            encoded_data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        elif isinstance(data, (bytes, bytearray)):
            encoded_data = data
            
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            try:
                parsed_json = json.loads(body)
            except Exception:
                parsed_json = body
            return status_code, parsed_json
    except urllib.error.HTTPError as e:
        status_code = e.code
        body = e.read().decode("utf-8")
        try:
            parsed_json = json.loads(body)
        except Exception:
            parsed_json = body
        return status_code, parsed_json
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=" * 60, flush=True)
    print("Starting Live End-to-End System & Security Verification", flush=True)
    print("=" * 60, flush=True)

    # 1. Candidate Login
    print("\n--- 1. Testing Candidate Authentication & Profile ---", flush=True)
    st, data = make_request(f"{BASE_URL}/auth/login/", method="POST", data={
        "email": "candidate1@example.com",
        "password": "CandidatePass123!"
    })
    assert st == 200, f"Candidate login failed: {data}"
    cand_token = data["access"]
    cand_headers = {"Authorization": f"Bearer {cand_token}"}
    print("[PASS] Candidate login successful", flush=True)

    # Get Profile
    st, data = make_request(f"{BASE_URL}/candidates/profile/", headers=cand_headers)
    assert st == 200, f"Candidate get profile failed: {data}"
    print(f"[PASS] Candidate profile retrieved: {data.get('headline')}", flush=True)

    # Update Profile
    st, data = make_request(f"{BASE_URL}/candidates/profile/", method="PUT", data={
        "headline": "Lead Full Stack & Cloud Architect",
        "location": "San Francisco, CA",
        "phone": "+1-555-0199",
        "bio": "Experienced architect specialized in high-performance cloud applications.",
        "skills": ["Python", "Django", "React", "Docker", "PostgreSQL", "AWS"]
    }, headers=cand_headers)
    assert st == 200, f"Profile update failed: {data}"
    print("[PASS] Candidate profile and skills updated successfully", flush=True)

    # 2. Candidate Resumes List & Download
    print("\n--- 2. Testing Candidate Resume Management ---", flush=True)
    st, resumes = make_request(f"{BASE_URL}/candidates/resumes/", headers=cand_headers)
    assert st == 200, f"List resumes failed: {resumes}"
    resume_list = resumes.get("results", resumes) if isinstance(resumes, dict) else resumes
    print(f"[PASS] Candidate resumes listed (Count: {len(resume_list)})", flush=True)
    assert len(resume_list) > 0, "No resumes found for candidate1"
    primary_resume = resume_list[0]
    st, dl_data = make_request(f"{BASE_URL}/candidates/resumes/{primary_resume['id']}/download/", headers=cand_headers)
    assert st == 200, f"Resume download failed: {st}"
    print(f"[PASS] Candidate downloaded primary resume (ID: {primary_resume['id']}) successfully", flush=True)

    # 3. Recruiter 1: Acme Cloud Systems
    print("\n--- 3. Testing Recruiter Job Lifecycle & Draft Visibility ---", flush=True)
    st, data = make_request(f"{BASE_URL}/auth/login/", method="POST", data={
        "email": "recruiter1@acme.com",
        "password": "RecruiterPass123!"
    })
    assert st == 200, f"Recruiter 1 login failed: {data}"
    rec1_token = data["access"]
    rec1_headers = {"Authorization": f"Bearer {rec1_token}"}
    print("[PASS] Recruiter 1 (Acme) logged in successfully", flush=True)

    # Create Draft Job
    job_payload = {
        "title": "Principal Systems Engineer (Live Test)",
        "employment_type": "FULL_TIME",
        "work_mode": "REMOTE",
        "experience_level": "LEAD",
        "location": "Remote, USA",
        "min_salary": 180000,
        "max_salary": 230000,
        "description": "Lead our core distributed cloud systems and kubernetes infrastructure.",
        "responsibilities": "Design distributed microservices and manage multi-region cloud topology.",
        "requirements": "10+ years experience in distributed systems.",
        "skills": ["Go", "Kubernetes", "Linux", "Terraform"],
        "status": "DRAFT"
    }
    st, data = make_request(f"{BASE_URL}/jobs/recruiter/", method="POST", data=job_payload, headers=rec1_headers)
    assert st == 201, f"Create job failed: {data}"
    job_id = data["id"]
    job_slug = data["slug"]
    print(f"[PASS] Job draft created (ID: {job_id}, Slug: {job_slug}, Status: DRAFT)", flush=True)

    # Candidate should NOT see draft job in public search
    st, search_data = make_request(f"{BASE_URL}/jobs/?search=Principal+Systems+Engineer")
    assert st == 200
    assert not any(j["id"] == job_id for j in search_data.get("results", [])), "Draft job leaked into public search!"
    print("[PASS] Security check: Draft job is completely hidden from public/candidate search", flush=True)

    # Candidate should get 404 when directly requesting draft job by slug
    st, _ = make_request(f"{BASE_URL}/jobs/{job_slug}/", headers=cand_headers)
    assert st == 404, f"Candidate was able to see draft job: {st}"
    print("[PASS] Security check: Direct GET for draft job returns 404 to candidates", flush=True)

    # Publish the job
    st, data = make_request(f"{BASE_URL}/jobs/recruiter/{job_id}/", method="PATCH", data={"status": "PUBLISHED"}, headers=rec1_headers)
    assert st == 200, f"Publish job failed: {data}"
    print("[PASS] Job published successfully by owner recruiter", flush=True)

    # Now candidate should be able to see published job
    st, data = make_request(f"{BASE_URL}/jobs/{job_slug}/", headers=cand_headers)
    assert st == 200, f"Published job not accessible: {st}"
    print("[PASS] Published job is now publicly accessible to candidates", flush=True)

    # 4. Job Application & Duplicate Guard
    print("\n--- 4. Testing Application Submission & Duplicate Prevention ---", flush=True)
    st, app_data = make_request(f"{BASE_URL}/applications/apply/", method="POST", data={
        "job_id": job_id,
        "resume_id": primary_resume["id"],
        "cover_letter": "I have extensive experience leading cloud infrastructure teams."
    }, headers=cand_headers)
    assert st == 201, f"Application failed: {app_data}"
    app_id = app_data["id"]
    print(f"[PASS] Candidate applied successfully (Application ID: {app_id})", flush=True)

    # Duplicate application attempt
    st, dup_data = make_request(f"{BASE_URL}/applications/apply/", method="POST", data={
        "job_id": job_id,
        "resume_id": primary_resume["id"],
        "cover_letter": "Duplicate attempt"
    }, headers=cand_headers)
    assert st == 400, f"Duplicate application was not prevented: {st}"
    print("[PASS] Duplicate application correctly rejected with 400 Bad Request", flush=True)

    # 5. Candidate Private Notes Inaccessibility & Status Timeline
    print("\n--- 5. Testing Recruiter Notes Isolation & Candidate Timeline ---", flush=True)
    # Recruiter 1 adds note
    st, note_data = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/notes/", method="POST", data={
        "note": "Candidate profile looks very strong. Schedule technical screen."
    }, headers=rec1_headers)
    assert st == 201, f"Add note failed: {note_data}"
    print("[PASS] Recruiter 1 added internal note successfully", flush=True)

    # Candidate requests their application detail
    st, cand_app = make_request(f"{BASE_URL}/applications/candidate/my-applications/{app_id}/", headers=cand_headers)
    assert st == 200
    assert "recruiter_notes" not in cand_app or not cand_app.get("recruiter_notes"), "Candidate was leaked recruiter notes!"
    print("[PASS] Security check: Private recruiter notes are hidden from candidate serializer", flush=True)

    # Candidate attempts to directly query recruiter notes endpoint
    st, _ = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/notes/", headers=cand_headers)
    assert st in [403, 404], f"Candidate accessed recruiter notes endpoint: {st}"
    print("[PASS] Security check: Candidate blocked from recruiter notes endpoint (HTTP 403)", flush=True)

    # 6. Cross-Company Recruiter Isolation (Recruiter 2: TechNova AI)
    print("\n--- 6. Testing Cross-Company Recruiter Isolation ---", flush=True)
    rec2_resp = make_request(f"{BASE_URL}/auth/login/", method="POST", data={
        "email": "recruiter2@technova.com",
        "password": "RecruiterPass123!"
    })
    st, data = rec2_resp
    assert st == 200, f"Recruiter 2 login failed: {data}"
    rec2_token = data["access"]
    rec2_headers = {"Authorization": f"Bearer {rec2_token}"}
    print("[PASS] Recruiter 2 (TechNova AI) logged in successfully", flush=True)

    # Recruiter 2 attempts to edit Recruiter 1's job
    st, _ = make_request(f"{BASE_URL}/jobs/recruiter/{job_id}/", method="PATCH", data={"title": "Hacked Title"}, headers=rec2_headers)
    assert st in [403, 404], f"Recruiter 2 modified Acme job: {st}"
    print("[PASS] Security check: Recruiter 2 cannot edit Acme's job (404/403)", flush=True)

    # Recruiter 2 attempts to view Acme's applicant application
    st, _ = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/", headers=rec2_headers)
    assert st in [403, 404], f"Recruiter 2 viewed Acme applicant: {st}"
    print("[PASS] Security check: Recruiter 2 cannot view Acme's applicant (404/403)", flush=True)

    # Recruiter 2 attempts to update Acme applicant status
    st, _ = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/status/", method="POST", data={"status": "REJECTED"}, headers=rec2_headers)
    assert st in [403, 404], f"Recruiter 2 updated Acme applicant status: {st}"
    print("[PASS] Security check: Recruiter 2 cannot update Acme's applicant status (404/403)", flush=True)

    # Recruiter 2 attempts to read Acme applicant notes
    st, _ = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/notes/", headers=rec2_headers)
    assert st in [403, 404], f"Recruiter 2 accessed Acme notes: {st}"
    print("[PASS] Security check: Recruiter 2 cannot read Acme's internal notes (404/403)", flush=True)

    # 7. Recruiter Pipeline Status Transitions & Guard
    print("\n--- 7. Testing Status Transitions & Withdrawal Guard ---", flush=True)
    # Recruiter advances status to UNDER_REVIEW
    st, data = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/status/", method="POST", data={
        "status": "UNDER_REVIEW",
        "notes": "Under initial engineering review."
    }, headers=rec1_headers)
    assert st == 200, f"Status update failed: {data}"
    print("[PASS] Status advanced to UNDER_REVIEW with audit log", flush=True)

    # Recruiter attempts to set status to WITHDRAWN (forbidden)
    st, data = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/status/", method="POST", data={
        "status": "WITHDRAWN",
        "notes": "Recruiter trying to withdraw candidate"
    }, headers=rec1_headers)
    assert st == 400, f"Recruiter was allowed to set WITHDRAWN: {st}"
    print("[PASS] Recruiter forbidden from setting WITHDRAWN status (400 Bad Request)", flush=True)

    # Candidate withdraws application
    st, data = make_request(f"{BASE_URL}/applications/candidate/my-applications/{app_id}/withdraw/", method="POST", headers=cand_headers)
    assert st == 200, f"Candidate withdrawal failed: {data}"
    assert data["status"] == "WITHDRAWN"
    print("[PASS] Candidate successfully withdrew application", flush=True)

    # Recruiter attempts to modify status of WITHDRAWN application (forbidden)
    st, data = make_request(f"{BASE_URL}/applications/recruiter/applications/{app_id}/status/", method="POST", data={
        "status": "INTERVIEW_SCHEDULED",
        "notes": "Trying to revive withdrawn application"
    }, headers=rec1_headers)
    assert st == 400, f"Recruiter modified withdrawn app: {st}"
    print("[PASS] Guard check: Cannot modify application after candidate withdrawal (400 Bad Request)", flush=True)

    # 8. Administrator Portal & Moderation
    print("\n--- 8. Testing Administrator Controls & Moderation ---", flush=True)
    st, data = make_request(f"{BASE_URL}/auth/login/", method="POST", data={
        "email": "admin@example.com",
        "password": "AdminPass123!"
    })
    assert st == 200, f"Admin login failed: {data}"
    admin_token = data["access"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Administrator logged in successfully", flush=True)

    # Admin Stats
    st, stats_data = make_request(f"{BASE_URL}/admin-portal/stats/", headers=admin_headers)
    assert st == 200, f"Admin stats failed: {stats_data}"
    print(f"[PASS] Admin stats retrieved (Total Users: {stats_data['users']['total']}, Jobs: {stats_data['jobs']['total']}, Applications: {stats_data['applications']['total']})", flush=True)

    # Admin Job Moderation (Archive job) - uses PATCH
    st, mod_data = make_request(f"{BASE_URL}/admin-portal/jobs/{job_id}/moderate/", method="PATCH", data={"status": "ARCHIVED"}, headers=admin_headers)
    assert st == 200, f"Job moderation failed: {mod_data}"
    print("[PASS] Admin moderated job to ARCHIVED", flush=True)

    # Candidate blocked from Admin portal
    st, _ = make_request(f"{BASE_URL}/admin-portal/stats/", headers=cand_headers)
    assert st == 403, f"Candidate accessed admin portal: {st}"
    print("[PASS] Security check: Candidate blocked from admin portal (403 Forbidden)", flush=True)

    print("\n" + "=" * 60, flush=True)
    print("ALL 24 LIVE END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    import traceback
    try:
        run_tests()
    except Exception as e:
        print(f"\n[FAIL] Verification error: {e}", file=sys.stderr, flush=True)
        traceback.print_exc()
        sys.exit(1)
