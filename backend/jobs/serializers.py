"""
Serializers for Job model.
"""
from rest_framework import serializers
from .models import Job
from companies.serializers import CompanySerializer
from applications.models import JobApplication

class JobPublicListSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 'company', 'location',
            'work_mode', 'employment_type', 'experience_level',
            'min_salary', 'max_salary', 'currency', 'is_featured',
            'skills', 'created_at', 'closing_date'
        ]


class JobPublicDetailSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    has_applied = serializers.SerializerMethodField()
    recruiter_name = serializers.CharField(source='recruiter.get_full_name', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 'company', 'location',
            'work_mode', 'employment_type', 'experience_level',
            'min_salary', 'max_salary', 'currency', 'description',
            'responsibilities', 'requirements', 'skills',
            'views_count', 'applications_count', 'closing_date',
            'is_featured', 'created_at', 'updated_at', 'status',
            'has_applied', 'recruiter_name'
        ]

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == 'CANDIDATE':
            return JobApplication.objects.filter(job=obj, candidate=request.user).exists()
        return False


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'responsibilities',
            'requirements', 'skills', 'experience_level',
            'employment_type', 'work_mode', 'location',
            'min_salary', 'max_salary', 'currency', 'status',
            'closing_date', 'is_featured'
        ]

    def validate(self, attrs):
        min_sal = attrs.get('min_salary')
        max_sal = attrs.get('max_salary')
        if min_sal and max_sal and min_sal > max_sal:
            raise serializers.ValidationError({"min_salary": "Minimum salary cannot exceed maximum salary."})
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        profile = getattr(user, 'recruiter_profile', None)
        if not profile or not profile.company:
            raise serializers.ValidationError("Recruiter must be associated with a company to post jobs.")

        validated_data['recruiter'] = user
        validated_data['company'] = profile.company
        return super().create(validated_data)


class RecruiterJobManageSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    applications_count = serializers.IntegerField(read_only=True)
    views_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 'company_name', 'location',
            'work_mode', 'employment_type', 'experience_level',
            'min_salary', 'max_salary', 'currency', 'status',
            'applications_count', 'views_count', 'closing_date',
            'is_featured', 'created_at', 'updated_at'
        ]
