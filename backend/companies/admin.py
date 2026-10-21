from django.contrib import admin
from .models import Company, RecruiterProfile

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'industry', 'location', 'size', 'is_verified', 'is_active', 'created_at')
    list_filter = ('is_verified', 'is_active', 'industry', 'size')
    search_fields = ('name', 'industry', 'location')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'title', 'is_company_admin', 'created_at')
    list_filter = ('is_company_admin', 'company')
    search_fields = ('user__email', 'company__name', 'title')
