"""
Views for Admin Dashboard and platform moderation.
"""
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from accounts.models import User
from companies.models import Company
from jobs.models import Job
from applications.models import JobApplication
from common.permissions import IsAdminRole
from common.pagination import StandardResultsSetPagination
from .serializers import (
    AdminUserManageSerializer,
    AdminCompanyManageSerializer,
    AdminJobManageSerializer
)

class AdminDashboardStatsView(APIView):
    """
    High-level platform metrics for administrators.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_users = User.objects.count()
        candidates_count = User.objects.filter(role=User.Role.CANDIDATE).count()
        recruiters_count = User.objects.filter(role=User.Role.RECRUITER).count()
        companies_count = Company.objects.count()
        verified_companies = Company.objects.filter(is_verified=True).count()
        total_jobs = Job.objects.count()
        active_jobs = Job.objects.filter(status=Job.Status.PUBLISHED).count()
        total_applications = JobApplication.objects.count()

        return Response({
            'users': {
                'total': total_users,
                'candidates': candidates_count,
                'recruiters': recruiters_count,
            },
            'companies': {
                'total': companies_count,
                'verified': verified_companies,
            },
            'jobs': {
                'total': total_jobs,
                'active': active_jobs,
            },
            'applications': {
                'total': total_applications,
            }
        })


class AdminUsersListView(generics.ListAPIView):
    """
    List and filter all users on the platform.
    """
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserManageSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'email']
    ordering = ['-created_at']
    queryset = User.objects.all().select_related('recruiter_profile__company')


class AdminToggleUserActiveView(APIView):
    """
    Activate or suspend a user account.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user == request.user:
            return Response(
                {"error": "You cannot suspend your own admin account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = not user.is_active
        user.save()
        return Response({
            "message": f"User account {'activated' if user.is_active else 'suspended'}.",
            "is_active": user.is_active
        })


class AdminCompaniesListView(generics.ListAPIView):
    """
    List and filter all companies on the platform.
    """
    permission_classes = [IsAdminRole]
    serializer_class = AdminCompanyManageSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_verified', 'is_active']
    search_fields = ['name', 'industry', 'location']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    queryset = Company.objects.all().prefetch_related('recruiters', 'jobs')


class AdminVerifyCompanyView(APIView):
    """
    Verify or unverify a company profile.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        company.is_verified = not company.is_verified
        company.save()
        return Response({
            "message": f"Company {'verified' if company.is_verified else 'unverified'}.",
            "is_verified": company.is_verified
        })


class AdminToggleCompanyActiveView(APIView):
    """
    Activate or deactivate a company and its jobs.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        company.is_active = not company.is_active
        company.save()
        return Response({
            "message": f"Company {'activated' if company.is_active else 'deactivated'}.",
            "is_active": company.is_active
        })


class AdminJobsListView(generics.ListAPIView):
    """
    List and moderate all jobs across the platform.
    """
    permission_classes = [IsAdminRole]
    serializer_class = AdminJobManageSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'experience_level', 'work_mode']
    search_fields = ['title', 'company__name', 'location']
    ordering_fields = ['created_at', 'applications_count']
    ordering = ['-created_at']
    queryset = Job.objects.all().select_related('company', 'recruiter')


class AdminModerateJobView(APIView):
    """
    Deactivate or archive an inappropriate job posting.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        job = get_object_or_404(Job, pk=pk)
        new_status = request.data.get('status', Job.Status.ARCHIVED)
        if new_status not in Job.Status.values:
            return Response(
                {"error": f"Invalid status. Choose from: {list(Job.Status.values)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        job.status = new_status
        job.save()
        return Response({
            "message": f"Job moderated to {job.get_status_display()}.",
            "status": job.status
        })
