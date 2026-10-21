from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'recruiter', 'location', 'work_mode', 'employment_type', 'status', 'applications_count', 'created_at')
    list_filter = ('status', 'work_mode', 'employment_type', 'experience_level', 'company')
    search_fields = ('title', 'company__name', 'location', 'skills')
    prepopulated_fields = {'slug': ('title',)}
