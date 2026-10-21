"""
Company and Recruiter models.
"""
from django.db import models
from django.utils.text import slugify
from django.conf import settings

class Company(models.Model):
    """
    Company profile for employers offering job listings.
    """
    COMPANY_SIZE_CHOICES = [
        ('1-10', '1-10 employees'),
        ('11-50', '11-50 employees'),
        ('51-200', '51-200 employees'),
        ('201-500', '201-500 employees'),
        ('501-1000', '501-1000 employees'),
        ('1000+', '1000+ employees'),
    ]

    name = models.CharField(max_length=255, unique=True, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    logo = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    website = models.URLField(max_length=300, blank=True, default='')
    industry = models.CharField(max_length=150, db_index=True)
    location = models.CharField(max_length=255)
    description = models.TextField()
    size = models.CharField(max_length=50, choices=COMPANY_SIZE_CHOICES, default='11-50')
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Companies'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name', 'industry']),
            models.Index(fields=['is_active', 'is_verified']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Company.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class RecruiterProfile(models.Model):
    """
    Recruiter profile linking a User to their employer Company.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recruiter_profile'
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='recruiters',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=150, default='Hiring Manager')
    is_company_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        company_name = self.company.name if self.company else "No Company"
        return f"{self.user.email} - {self.title} at {company_name}"
