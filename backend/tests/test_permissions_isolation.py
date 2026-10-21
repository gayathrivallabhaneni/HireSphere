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
class TestPermissionsAndCrossCompanyIsolation:
    def setup_method(self):
        self.client = APIClient()

        # Company A & Recruiter A
        self.comp_a = Company.objects.create(name='Company Alpha', industry='Tech', location='Remote')
        self.recruiter_a = User.objects.create_user(
            email='rec_a@test.com', password='Password123!', role='RECRUITER'
        )
        RecruiterProfile.objects.create(user=self.recruiter_a, company=self.comp_a, is_company_admin=True)

        # Company B & Recruiter B
        self.comp_b = Company.objects.create(name='Company Beta', industry='Design', location='Remote')
        self.recruiter_b = User.objects.create_user(
            email='rec_b@test.com', password='Password123!', role='RECRUITER'
        )
        RecruiterProfile.objects.create(user=self.recruiter_b, company=self.comp_b, is_company_admin=True)

        # Candidate
        self.candidate = User.objects.create_user(
            email='cand@test.com', password='Password123!', role='CANDIDATE'
        )
        CandidateProfile.objects.create(user=self.candidate, headline='Python Dev')

        # Dummy valid PDF resume for candidate
        pdf_content = b"%PDF-1.4 ... dummy valid bytes ... %%EOF"
        dummy_file = SimpleUploadedFile("resume.pdf", pdf_content, content_type="application/pdf")
        self.resume = Resume.objects.create(
            user=self.candidate,
            title="My Tech Resume",
            file=dummy_file,
            original_filename="resume.pdf",
            file_size=len(pdf_content),
            is_primary=True
        )

        # Job belonging to Company A
        self.job_a = Job.objects.create(
            company=self.comp_a,
            recruiter=self.recruiter_a,
            title='Backend Dev A',
            description='Job description for A',
            responsibilities='Resp A',
            requirements='Req A',
            status='PUBLISHED',
            location='Remote'
        )

        # Job belonging to Company B
        self.job_b = Job.objects.create(
            company=self.comp_b,
            recruiter=self.recruiter_b,
            title='Designer B',
            description='Job description for B',
            responsibilities='Resp B',
            requirements='Req B',
            status='PUBLISHED',
            location='Remote'
        )

    def test_candidate_cannot_post_job(self):
        self.client.force_authenticate(user=self.candidate)
        url = reverse('recruiter_job_list_create')
        data = {
            'title': 'Illegal Job',
            'description': 'Desc',
            'responsibilities': 'Resp',
            'requirements': 'Req',
            'location': 'Remote'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_recruiter_cannot_modify_other_company_job(self):
        # Recruiter B tries to edit Job belonging to Company A
        self.client.force_authenticate(user=self.recruiter_b)
        url = reverse('recruiter_job_detail', kwargs={'pk': self.job_a.id})
        response = self.client.patch(url, {'title': 'Hacked Title'})
        assert response.status_code == status.HTTP_404_NOT_FOUND

        # Verify Job A was not modified
        self.job_a.refresh_from_db()
        assert self.job_a.title == 'Backend Dev A'

    def test_candidate_can_apply_and_duplicate_is_prevented(self):
        self.client.force_authenticate(user=self.candidate)
        url = reverse('candidate_apply')
        data = {
            'job_id': self.job_a.id,
            'resume_id': self.resume.id,
            'cover_letter': 'I love company A!'
        }
        # First application succeeds
        response1 = self.client.post(url, data)
        assert response1.status_code == status.HTTP_201_CREATED
        assert JobApplication.objects.filter(job=self.job_a, candidate=self.candidate).count() == 1

        # Second application to same job fails with duplicate validation error
        response2 = self.client.post(url, data)
        assert response2.status_code == status.HTTP_400_BAD_REQUEST
        assert 'already applied' in str(response2.data).lower()

    def test_cross_company_application_isolation(self):
        # Candidate applies to Job A
        app_a = JobApplication.objects.create(
            job=self.job_a,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )

        # Recruiter A sees app_a
        self.client.force_authenticate(user=self.recruiter_a)
        res_a = self.client.get(reverse('recruiter_applications_list'))
        assert res_a.status_code == status.HTTP_200_OK
        app_ids_a = [item['id'] for item in res_a.data['results']]
        assert app_a.id in app_ids_a

        # Recruiter B DOES NOT see app_a
        self.client.force_authenticate(user=self.recruiter_b)
        res_b = self.client.get(reverse('recruiter_applications_list'))
        assert res_b.status_code == status.HTTP_200_OK
        app_ids_b = [item['id'] for item in res_b.data['results']]
        assert app_a.id not in app_ids_b

    def test_secure_resume_download_authorization(self):
        # Candidate applies to Job A
        JobApplication.objects.create(
            job=self.job_a,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )

        download_url = reverse('resume_download', kwargs={'pk': self.resume.id})

        # 1. Candidate owner can download
        self.client.force_authenticate(user=self.candidate)
        res_owner = self.client.get(download_url)
        assert res_owner.status_code == status.HTTP_200_OK

        # 2. Recruiter A (job company candidate applied to) can download
        self.client.force_authenticate(user=self.recruiter_a)
        res_rec_a = self.client.get(download_url)
        assert res_rec_a.status_code == status.HTTP_200_OK

        # 3. Recruiter B (candidate DID NOT apply to Company B) is FORBIDDEN!
        self.client.force_authenticate(user=self.recruiter_b)
        res_rec_b = self.client.get(download_url)
        assert res_rec_b.status_code == status.HTTP_403_FORBIDDEN

    def test_candidate_cannot_see_recruiter_notes(self):
        app = JobApplication.objects.create(
            job=self.job_a,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )

        # Recruiter adds private note
        self.client.force_authenticate(user=self.recruiter_a)
        note_url = reverse('recruiter_application_notes', kwargs={'pk': app.id})
        self.client.post(note_url, {'note': 'Candidate salary expectation is too high.'})

        # Candidate fetches their application details
        self.client.force_authenticate(user=self.candidate)
        cand_app_url = reverse('candidate_application_detail', kwargs={'pk': app.id})
        cand_response = self.client.get(cand_app_url)
        assert cand_response.status_code == status.HTTP_200_OK
        assert 'notes' not in cand_response.data
        assert 'salary expectation is too high' not in str(cand_response.data)

    def test_status_transition_creates_audit_history(self):
        app = JobApplication.objects.create(
            job=self.job_a,
            candidate=self.candidate,
            resume=self.resume,
            status=JobApplication.Status.APPLIED
        )

        self.client.force_authenticate(user=self.recruiter_a)
        status_url = reverse('recruiter_update_status', kwargs={'pk': app.id})
        res = self.client.post(status_url, {
            'status': JobApplication.Status.SHORTLISTED,
            'notes': 'Impressive test score.'
        })
        assert res.status_code == status.HTTP_200_OK

        app.refresh_from_db()
        assert app.status == JobApplication.Status.SHORTLISTED

        # Check history record
        history = ApplicationStatusHistory.objects.filter(application=app)
        assert history.count() == 1
        assert history.first().from_status == JobApplication.Status.APPLIED
        assert history.first().to_status == JobApplication.Status.SHORTLISTED
        assert 'Impressive test score' in history.first().notes
