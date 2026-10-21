"""
Serializers for Company and Recruiter profiles.
"""
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Company, RecruiterProfile
from accounts.models import User

class CompanySerializer(serializers.ModelSerializer):
    active_jobs_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'slug', 'logo', 'website', 'industry',
            'location', 'description', 'size', 'is_verified',
            'is_active', 'created_at', 'updated_at', 'active_jobs_count'
        ]
        read_only_fields = ['id', 'slug', 'is_verified', 'is_active', 'created_at', 'updated_at', 'active_jobs_count']

    @extend_schema_field(serializers.IntegerField)
    def get_active_jobs_count(self, obj):
        return obj.jobs.filter(status='PUBLISHED').count()


class RecruiterProfileSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    recruiter_name = serializers.CharField(source='user.get_full_name', read_only=True)
    recruiter_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = RecruiterProfile
        fields = [
            'id', 'user', 'recruiter_name', 'recruiter_email',
            'company', 'title', 'is_company_admin', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'recruiter_name', 'recruiter_email', 'company', 'created_at']
