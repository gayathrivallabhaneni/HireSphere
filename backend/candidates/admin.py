from django.contrib import admin
from .models import CandidateProfile, Resume

@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'headline', 'experience_years', 'location', 'preferred_employment_type', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'headline', 'location')
    list_filter = ('preferred_employment_type',)

@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'file_type', 'file_size', 'is_primary', 'created_at')
    search_fields = ('title', 'user__email', 'original_filename')
    list_filter = ('is_primary', 'file_type')
