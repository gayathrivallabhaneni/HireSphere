"""
Serializers for authentication and user accounts.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db import transaction
from companies.models import Company, RecruiterProfile
from candidates.models import CandidateProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    company_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone_number', 'is_active', 'created_at',
            'company_details'
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'company_details']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_company_details(self, obj):
        if obj.role == User.Role.RECRUITER and hasattr(obj, 'recruiter_profile') and obj.recruiter_profile.company:
            comp = obj.recruiter_profile.company
            return {
                'id': comp.id,
                'name': comp.name,
                'slug': comp.slug,
                'logo': comp.logo.url if comp.logo else None,
                'industry': comp.industry,
                'location': comp.location,
                'is_company_admin': obj.recruiter_profile.is_company_admin
            }
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    company_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    company_industry = serializers.CharField(required=False, write_only=True, allow_blank=True)
    company_location = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm', 'first_name',
            'last_name', 'role', 'phone_number',
            'company_name', 'company_industry', 'company_location'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        
        role = attrs.get('role', User.Role.CANDIDATE)
        if role == User.Role.ADMIN:
            raise serializers.ValidationError({"role": "Cannot register as Administrator directly."})

        if role == User.Role.RECRUITER and not attrs.get('company_name'):
            raise serializers.ValidationError({"company_name": "Company name is required for recruiter registration."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        company_name = validated_data.pop('company_name', '').strip()
        company_industry = validated_data.pop('company_industry', 'Technology').strip() or 'Technology'
        company_location = validated_data.pop('company_location', 'Remote').strip() or 'Remote'
        password = validated_data.pop('password')

        with transaction.atomic():
            user = User.objects.create_user(password=password, **validated_data)

            if user.role == User.Role.CANDIDATE:
                CandidateProfile.objects.create(
                    user=user,
                    headline=f"Job Seeker - {user.first_name}"
                )
            elif user.role == User.Role.RECRUITER:
                # Find or create company
                company, _ = Company.objects.get_or_create(
                    name=company_name,
                    defaults={
                        'industry': company_industry,
                        'location': company_location,
                        'description': f"Welcome to {company_name}.",
                    }
                )
                RecruiterProfile.objects.create(
                    user=user,
                    company=company,
                    title='Hiring Manager',
                    is_company_admin=True
                )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number']


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "New passwords do not match."})
        return attrs
