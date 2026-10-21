from django.contrib import admin
from .models import JobApplication, ApplicationStatusHistory, RecruiterNote

class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('from_status', 'to_status', 'changed_by', 'notes', 'created_at')

class RecruiterNoteInline(admin.TabularInline):
    model = RecruiterNote
    extra = 0

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('candidate', 'job', 'status', 'applied_at', 'updated_at')
    list_filter = ('status', 'job__company')
    search_fields = ('candidate__email', 'job__title', 'job__company__name')
    inlines = [ApplicationStatusHistoryInline, RecruiterNoteInline]

@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'from_status', 'to_status', 'changed_by', 'created_at')
    list_filter = ('to_status',)

@admin.register(RecruiterNote)
class RecruiterNoteAdmin(admin.ModelAdmin):
    list_display = ('application', 'recruiter', 'created_at')
    search_fields = ('recruiter__email', 'note')
