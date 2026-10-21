"""
Serializers for Job Applications, Status History, and Recruiter Notes.
"""
from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from drf_spectacular.utils import extend_schema_field
from .models import JobApplication, ApplicationStatusHistory, RecruiterNote
from jobs.models import Job
from candidates.models import Resume, CandidateProfile
from jobs.serializers import JobPublicListSerializer
from candidates.serializers import ResumeSerializer

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by_name', 'notes', 'created_at']


class RecruiterNoteSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.CharField(source='recruiter.get_full_name', read_only=True)

    class Meta:
        model = RecruiterNote
        fields = ['id', 'recruiter_name', 'note', 'created_at']
        read_only_fields = ['id', 'recruiter_name', 'created_at']


class JobApplicationCreateSerializer(serializers.Serializer):
    job_id = serializers.IntegerField(required=True)
    resume_id = serializers.IntegerField(required=True)
    cover_letter = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_job_id(self, value):
        try:
            job = Job.objects.get(pk=value)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found.")
        if job.status != Job.Status.PUBLISHED:
            raise serializers.ValidationError("Applications are closed for this job opening.")
        return value

    def validate_resume_id(self, value):
        user = self.context['request'].user
        try:
            resume = Resume.objects.get(pk=value, user=user)
        except Resume.DoesNotExist:
            raise serializers.ValidationError("Selected resume not found or does not belong to you.")
        return value

    def validate(self, attrs):
        user = self.context['request'].user
        job_id = attrs['job_id']
        if JobApplication.objects.filter(job_id=job_id, candidate=user).exists():
            raise serializers.ValidationError("You have already applied for this job opening.")
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        job = Job.objects.get(pk=validated_data['job_id'])
        resume = Resume.objects.get(pk=validated_data['resume_id'])
        cover_letter = validated_data.get('cover_letter', '')

        with transaction.atomic():
            application = JobApplication.objects.create(
                job=job,
                candidate=user,
                resume=resume,
                cover_letter=cover_letter,
                status=JobApplication.Status.APPLIED
            )
            # Create initial status history entry
            ApplicationStatusHistory.objects.create(
                application=application,
                from_status='NONE',
                to_status=JobApplication.Status.APPLIED,
                changed_by=user,
                notes='Application submitted by candidate.'
            )
            # Atomically increment job applications counter
            Job.objects.filter(pk=job.pk).update(applications_count=F('applications_count') + 1)

        return application


class CandidateApplicationListSerializer(serializers.ModelSerializer):
    job = JobPublicListSerializer(read_only=True)
    resume = ResumeSerializer(read_only=True)

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'resume', 'status', 'applied_at', 'updated_at']


class CandidateApplicationDetailSerializer(serializers.ModelSerializer):
    job = JobPublicListSerializer(read_only=True)
    resume = ResumeSerializer(read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'resume', 'cover_letter',
            'status', 'applied_at', 'updated_at', 'status_history'
        ]


class RecruiterApplicationListSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.email', read_only=True)
    candidate_headline = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    resume = ResumeSerializer(read_only=True)
    notes_count = serializers.SerializerMethodField()

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_id', 'job_title', 'candidate_name', 'candidate_email',
            'candidate_headline', 'status', 'applied_at', 'updated_at',
            'resume', 'notes_count'
        ]

    @extend_schema_field(serializers.CharField)
    def get_candidate_headline(self, obj):
        profile = getattr(obj.candidate, 'candidate_profile', None)
        return profile.headline if profile else ''

    @extend_schema_field(serializers.IntegerField)
    def get_notes_count(self, obj):
        return obj.notes.count()


class RecruiterApplicationDetailSerializer(serializers.ModelSerializer):
    candidate_name = serializers.CharField(source='candidate.get_full_name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.email', read_only=True)
    candidate_phone = serializers.CharField(source='candidate.phone_number', read_only=True)
    candidate_profile = serializers.SerializerMethodField()
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    resume = ResumeSerializer(read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    notes = RecruiterNoteSerializer(many=True, read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job_id', 'job_title', 'candidate_name', 'candidate_email',
            'candidate_phone', 'candidate_profile', 'cover_letter',
            'status', 'applied_at', 'updated_at', 'resume',
            'status_history', 'notes'
        ]

    @extend_schema_field(serializers.DictField)
    def get_candidate_profile(self, obj):
        profile = getattr(obj.candidate, 'candidate_profile', None)
        if profile:
            return {
                'headline': profile.headline,
                'summary': profile.summary,
                'skills': profile.skills,
                'experience_years': profile.experience_years,
                'education': profile.education,
                'location': profile.location,
                'github_url': profile.github_url,
                'linkedin_url': profile.linkedin_url,
                'portfolio_url': profile.portfolio_url,
            }
        return None


class ApplicationStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=JobApplication.Status.choices)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
