"""
Candidate profile and resume models.
"""
from django.db import models
from django.conf import settings
from common.validators import validate_resume_file, resume_upload_path

class CandidateProfile(models.Model):
    """
    Detailed profile information for job seekers.
    """
    EMPLOYMENT_CHOICES = [
        ('FULL_TIME', 'Full-time'),
        ('PART_TIME', 'Part-time'),
        ('CONTRACT', 'Contract'),
        ('INTERNSHIP', 'Internship'),
        ('ANY', 'Any'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )
    headline = models.CharField(max_length=255, blank=True, default='')
    summary = models.TextField(blank=True, default='')
    skills = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    preferred_location = models.CharField(max_length=255, blank=True, default='')
    preferred_employment_type = models.CharField(
        max_length=50,
        choices=EMPLOYMENT_CHOICES,
        default='FULL_TIME'
    )
    salary_expectation = models.CharField(max_length=100, blank=True, default='')
    github_url = models.URLField(max_length=300, blank=True, default='')
    linkedin_url = models.URLField(max_length=300, blank=True, default='')
    portfolio_url = models.URLField(max_length=300, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} - Candidate Profile"


class Resume(models.Model):
    """
    Candidate uploaded resumes with file size, extension, and primary flag.
    Stored securely and served through permission-checked endpoints.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes'
    )
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to=resume_upload_path,
        validators=[validate_resume_file]
    )
    original_filename = models.CharField(max_length=255, blank=True, default='')
    file_size = models.PositiveIntegerField(default=0, help_text="File size in bytes")
    file_type = models.CharField(max_length=50, default='application/pdf')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # If this resume is set as primary, unset other resumes of this user
        if self.is_primary:
            Resume.objects.filter(user=self.user, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} ({self.user.email})"
