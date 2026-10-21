"""
Serializers for Candidate profile and Resumes.
"""
from rest_framework import serializers
from .models import CandidateProfile, Resume
from accounts.serializers import UserSerializer

class CandidateProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'user', 'headline', 'summary', 'skills',
            'experience_years', 'education', 'location',
            'preferred_location', 'preferred_employment_type',
            'salary_expectation', 'github_url', 'linkedin_url',
            'portfolio_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ResumeSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'title', 'original_filename', 'file_size',
            'file_type', 'is_primary', 'created_at', 'download_url'
        ]
        read_only_fields = ['id', 'original_filename', 'file_size', 'file_type', 'created_at', 'download_url']

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f"/api/candidates/resumes/{obj.id}/download/")
        return f"/api/candidates/resumes/{obj.id}/download/"


class ResumeUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'title', 'file', 'is_primary']

    def create(self, validated_data):
        file = validated_data['file']
        validated_data['user'] = self.context['request'].user
        validated_data['original_filename'] = file.name
        validated_data['file_size'] = file.size
        ext = file.name.split('.')[-1].lower()
        validated_data['file_type'] = 'application/pdf' if ext == 'pdf' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        return super().create(validated_data)
