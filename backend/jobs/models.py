"""
Job models for multi-vendor postings.
"""
from django.db import models
from django.utils.text import slugify
from django.conf import settings
import uuid

class Job(models.Model):
    """
    Job opening published by a company recruiter.
    """
    class ExperienceLevel(models.TextChoices):
        ENTRY = 'ENTRY', 'Entry Level (0-2 yrs)'
        MID = 'MID', 'Mid Level (2-5 yrs)'
        SENIOR = 'SENIOR', 'Senior Level (5-8 yrs)'
        LEAD = 'LEAD', 'Lead / Staff (8+ yrs)'
        EXECUTIVE = 'EXECUTIVE', 'Executive / Director'

    class EmploymentType(models.TextChoices):
        FULL_TIME = 'FULL_TIME', 'Full-time'
        PART_TIME = 'PART_TIME', 'Part-time'
        CONTRACT = 'CONTRACT', 'Contract'
        INTERNSHIP = 'INTERNSHIP', 'Internship'

    class WorkMode(models.TextChoices):
        ON_SITE = 'ON_SITE', 'On-site'
        REMOTE = 'REMOTE', 'Remote'
        HYBRID = 'HYBRID', 'Hybrid'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        PUBLISHED = 'PUBLISHED', 'Published'
        CLOSED = 'CLOSED', 'Closed'
        ARCHIVED = 'ARCHIVED', 'Archived'

    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='jobs'
    )
    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs'
    )
    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=300, unique=True, blank=True)
    description = models.TextField(help_text="Detailed overview of the role")
    responsibilities = models.TextField(help_text="Key duties and day-to-day responsibilities")
    requirements = models.TextField(help_text="Candidate qualifications and background")
    skills = models.JSONField(default=list, blank=True, help_text="Required or preferred technologies and skills")
    
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.MID,
        db_index=True
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
        db_index=True
    )
    work_mode = models.CharField(
        max_length=20,
        choices=WorkMode.choices,
        default=WorkMode.HYBRID,
        db_index=True
    )
    location = models.CharField(max_length=255, db_index=True)
    
    min_salary = models.PositiveIntegerField(null=True, blank=True)
    max_salary = models.PositiveIntegerField(null=True, blank=True)
    currency = models.CharField(max_length=10, default='USD')
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PUBLISHED,
        db_index=True
    )
    views_count = models.PositiveIntegerField(default=0)
    applications_count = models.PositiveIntegerField(default=0)
    closing_date = models.DateField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title', 'location']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['company', 'status']),
            models.Index(fields=['work_mode', 'employment_type']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(f"{self.company.name}-{self.title}")
            unique_hash = uuid.uuid4().hex[:6]
            self.slug = f"{base_slug}-{unique_hash}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} at {self.company.name} ({self.get_status_display()})"
