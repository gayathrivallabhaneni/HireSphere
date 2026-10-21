"""
Job application, status history, and recruiter notes models.
"""
from django.db import models
from django.conf import settings

class JobApplication(models.Model):
    """
    Candidate application to a specific job opening.
    """
    class Status(models.TextChoices):
        APPLIED = 'APPLIED', 'Applied'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        SHORTLISTED = 'SHORTLISTED', 'Shortlisted'
        INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', 'Interview Scheduled'
        OFFERED = 'OFFERED', 'Offered'
        REJECTED = 'REJECTED', 'Rejected'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'

    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_applications'
    )
    resume = models.ForeignKey(
        'candidates.Resume',
        on_delete=models.PROTECT,
        related_name='applications'
    )
    cover_letter = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True
    )
    applied_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        constraints = [
            models.UniqueConstraint(
                fields=['job', 'candidate'],
                name='unique_candidate_job_application'
            )
        ]
        indexes = [
            models.Index(fields=['job', 'status']),
            models.Index(fields=['candidate', 'status']),
        ]

    def __str__(self):
        return f"{self.candidate.email} -> {self.job.title} ({self.get_status_display()})"


class ApplicationStatusHistory(models.Model):
    """
    Audit log of status changes for an application.
    """
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.application_id}: {self.from_status} -> {self.to_status} at {self.created_at}"


class RecruiterNote(models.Model):
    """
    Internal private notes visible exclusively to company recruiters and platform admins.
    Never exposed to candidates.
    """
    application = models.ForeignKey(
        JobApplication,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recruiter_notes'
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.application_id} by {self.recruiter.email}"
