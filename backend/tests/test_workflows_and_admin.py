import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

from companies.models import Company, RecruiterProfile
from candidates.models import CandidateProfile, Resume
from jobs.models import Job
from applications.models import JobApplication, ApplicationStatusHistory

User = get_user_model()

@pytest.mark.django_db
class TestWorkflowsAndAdminSecurity:
    def setup_method(self):
        self.client = APIClient()

        # Admin User
        self.admin = User.objects.create_user(
            email='admin@test.com', password='AdminPass123!', role='ADMIN', is_staff=True
        )

        # Company & Recruiter
        self.company = Company.objects.create(name='Acme Labs', industry='Cloud', location='Remote')
        self.recruiter = User.objects.create_user(
            email='rec@acme.com', password='Password123!', role='RECRUITER'
        )
        RecruiterProfile.objects.create(user=self.recruiter, company=self.company, is_company_admin=True)

        # Candidate
        self.candidate = User.objects.create_user(
            email='cand@test.com', password='Password123!', role='CANDIDATE'
        )
        CandidateProfile.objects.create(user=self.candidate, headline='Full Stack Engineer')

        # Resume
        pdf_bytes = b"%PDF-1.4 sample content %%EOF"
        dummy_file = SimpleUploadedFile("cand_resume.pdf", pdf_bytes, content_type="application/pdf")
        self.resume = Resume.objects.create(
            user=self.candidate,
            title="Alex Resume",
            file=dummy_file,
            original_filename="cand_resume.pdf",
            file_size=len(pdf_bytes),
            is_primary=True
        )

        # Published Job
        self.job = Job.objects.create(
            company=self.company,
            recruiter=self.recruiter,
            title='Software Engineer',
            description='Build scalable systems',
            responsibilities='Write clean code',
            requirements='Proficient in Python',
            status=Job.Status.PUBLISHED,
            location='San Francisco, CA',
            work_mode=Job.WorkMode.REMOTE,
            employment_type=Job.EmploymentType.FULL_TIME,
            min_salary=120000,
            max_salary=160000
        )

        # Draft Job
        self.draft_job = Job.objects.create(
            company=self.company,
            recruiter=self.recruiter,
            title='Confidential VP Role',
            description='Draft role description',
            responsibilities='Lead organization',
            requirements='10+ years leadership',
            status=Job.Status.DRAFT,
            location='New York, NY'
        )

    def test_draft_job_hidden_from_public_and_candidate(self):
        # 1. Anonymous user accessing draft job -> 404 Not Found
        url = reverse('job_public_detail', kwargs={'slug': self.draft_job.slug})
        anon_res = self.client.get(url)
        assert anon_res.status_code == status.HTTP_404_NOT_FOUND

        # 2. Candidate accessing draft job -> 404 Not Found
        self.client.force_authenticate(user=self.candidate)
        cand_res = self.client.get(url)
        assert cand_res.status_code == status.HTTP_404_NOT_FOUND

        # 3. Owner Recruiter accessing draft job -> 200 OK
        self.client.force_authenticate(user=self.recruiter)
        rec_res = self.client.get(url)
        assert rec_res.status_code == status.HTTP_200_OK

        # 4. Administrator accessing draft job -> 200 OK
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get(url)
        assert admin_res.status_code == status.HTTP_200_OK

    def test_candidate_withdraw_workflow_and_guard(self):
        # Submit application
        app = JobApplication.objects.create(
            job=self.job,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )

        # Candidate withdraws application
        self.client.force_authenticate(user=self.candidate)
        withdraw_url = reverse('candidate_withdraw_application', kwargs={'pk': app.id})
        res = self.client.post(withdraw_url, {'notes': 'Accepted another offer.'})
        assert res.status_code == status.HTTP_200_OK
        app.refresh_from_db()
        assert app.status == JobApplication.Status.WITHDRAWN

        # Recruiter tries to alter status of withdrawn application -> 400 Bad Request
        self.client.force_authenticate(user=self.recruiter)
        status_url = reverse('recruiter_update_status', kwargs={'pk': app.id})
        rec_res = self.client.post(status_url, {'status': JobApplication.Status.SHORTLISTED})
        assert rec_res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'withdrawn' in str(rec_res.data).lower()

    def test_recruiter_cannot_set_withdrawn_status(self):
        app = JobApplication.objects.create(
            job=self.job,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )
        self.client.force_authenticate(user=self.recruiter)
        status_url = reverse('recruiter_update_status', kwargs={'pk': app.id})
        res = self.client.post(status_url, {'status': JobApplication.Status.WITHDRAWN})
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'only candidates' in str(res.data).lower()

    def test_cannot_withdraw_offered_or_rejected_application(self):
        app = JobApplication.objects.create(
            job=self.job,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.OFFERED
        )
        self.client.force_authenticate(user=self.candidate)
        withdraw_url = reverse('candidate_withdraw_application', kwargs={'pk': app.id})
        res = self.client.post(withdraw_url)
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert 'cannot withdraw' in str(res.data).lower()

    def test_non_admin_cannot_access_admin_portal(self):
        # Candidate tries to access admin stats -> 403 Forbidden
        self.client.force_authenticate(user=self.candidate)
        cand_res = self.client.get(reverse('admin_stats'))
        assert cand_res.status_code == status.HTTP_403_FORBIDDEN

        # Recruiter tries to access admin users list -> 403 Forbidden
        self.client.force_authenticate(user=self.recruiter)
        rec_res = self.client.get(reverse('admin_users_list'))
        assert rec_res.status_code == status.HTTP_403_FORBIDDEN

        # Admin accesses admin stats -> 200 OK
        self.client.force_authenticate(user=self.admin)
        admin_res = self.client.get(reverse('admin_stats'))
        assert admin_res.status_code == status.HTTP_200_OK
        assert 'users' in admin_res.data
        assert 'jobs' in admin_res.data

    def test_admin_can_toggle_user_active_and_moderate_jobs(self):
        self.client.force_authenticate(user=self.admin)

        # 1. Suspend candidate
        user_url = reverse('admin_toggle_user_active', kwargs={'pk': self.candidate.id})
        res = self.client.patch(user_url)
        assert res.status_code == status.HTTP_200_OK
        self.candidate.refresh_from_db()
        assert self.candidate.is_active is False

        # Reactivate candidate
        res2 = self.client.patch(user_url)
        assert res2.status_code == status.HTTP_200_OK
        self.candidate.refresh_from_db()
        assert self.candidate.is_active is True

        # 2. Moderate job (archive)
        job_url = reverse('admin_moderate_job', kwargs={'pk': self.job.id})
        mod_res = self.client.patch(job_url, {'status': Job.Status.ARCHIVED})
        assert mod_res.status_code == status.HTTP_200_OK
        self.job.refresh_from_db()
        assert self.job.status == Job.Status.ARCHIVED

    def test_job_public_search_and_filtering(self):
        url = reverse('job_public_list')

        # Keyword search
        res1 = self.client.get(f"{url}?search=Software")
        assert res1.status_code == status.HTTP_200_OK
        assert res1.data['count'] >= 1
        assert any(item['id'] == self.job.id for item in res1.data['results'])

        # Location filter
        res2 = self.client.get(f"{url}?location=Francisco")
        assert res2.status_code == status.HTTP_200_OK
        assert any(item['id'] == self.job.id for item in res2.data['results'])

        # Work mode filter
        res3 = self.client.get(f"{url}?work_mode=REMOTE")
        assert res3.status_code == status.HTTP_200_OK
        assert any(item['id'] == self.job.id for item in res3.data['results'])

        # Salary filter
        res4 = self.client.get(f"{url}?min_salary=100000&max_salary=180000")
        assert res4.status_code == status.HTTP_200_OK
        assert any(item['id'] == self.job.id for item in res4.data['results'])
