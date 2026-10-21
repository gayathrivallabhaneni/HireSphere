"""
Serializers for Admin Portal operations.
"""
from rest_framework import serializers
from accounts.models import User
from companies.models import Company
from jobs.models import Job
from applications.models import JobApplication

class AdminUserManageSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'role', 'phone_number', 'is_active', 'is_staff',
            'created_at', 'company_name'
        ]

    def get_company_name(self, obj):
        if obj.role == User.Role.RECRUITER and hasattr(obj, 'recruiter_profile') and obj.recruiter_profile.company:
            return obj.recruiter_profile.company.name
        return None


class AdminCompanyManageSerializer(serializers.ModelSerializer):
    recruiters_count = serializers.SerializerMethodField()
    jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'logo', 'website', 'industry',
            'location', 'description', 'size', 'is_verified',
            'is_active', 'created_at', 'recruiters_count', 'jobs_count'
        ]

    def get_recruiters_count(self, obj):
        return obj.recruiters.count()

    def get_jobs_count(self, obj):
        return obj.jobs.count()


class AdminJobManageSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    recruiter_email = serializers.EmailField(source='recruiter.email', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 'company_name', 'recruiter_email',
            'location', 'work_mode', 'employment_type', 'experience_level',
            'status', 'applications_count', 'views_count', 'created_at',
            'is_featured'
        ]
