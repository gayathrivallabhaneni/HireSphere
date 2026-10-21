"""
Views for Job listings, searches, and recruiter management.
"""
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import F, Q
from django.shortcuts import get_object_or_404

from .models import Job
from .filters import JobFilter
from .serializers import (
    JobPublicListSerializer,
    JobPublicDetailSerializer,
    JobCreateUpdateSerializer,
    RecruiterJobManageSerializer
)
from common.permissions import IsRecruiter, IsAdminRole
from common.pagination import StandardResultsSetPagination

class JobPublicListView(generics.ListAPIView):
    """
    Public job search and discovery endpoint.
    Filters: keyword search, location, experience_level, employment_type, work_mode, salary range.
    """
    queryset = Job.objects.filter(
        status=Job.Status.PUBLISHED,
        company__is_active=True
    ).select_related('company').order_by('-is_featured', '-created_at')
    serializer_class = JobPublicListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = JobFilter
    ordering_fields = ['created_at', 'min_salary', 'max_salary', 'title']
    ordering = ['-is_featured', '-created_at']


class JobPublicDetailView(generics.RetrieveAPIView):
    """
    Public job detail view by slug.
    Increments views_count automatically.
    Only PUBLISHED jobs are viewable by public/candidates; job owner recruiter or admin can preview non-published.
    """
    serializer_class = JobPublicDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        base_qs = Job.objects.filter(company__is_active=True).select_related('company', 'recruiter')
        if user.is_authenticated and (user.role == 'ADMIN' or user.is_staff or user.is_superuser):
            return base_qs
        if user.is_authenticated and user.role == 'RECRUITER' and hasattr(user, 'recruiter_profile') and user.recruiter_profile.company:
            return base_qs.filter(Q(status=Job.Status.PUBLISHED) | Q(company=user.recruiter_profile.company))
        return base_qs.filter(status=Job.Status.PUBLISHED)

    def get_object(self):
        obj = super().get_object()
        # Increment views atomically
        Job.objects.filter(pk=obj.pk).update(views_count=F('views_count') + 1)
        obj.refresh_from_db()
        return obj


class RecruiterJobListCreateView(generics.ListCreateAPIView):
    """
    List jobs belonging to recruiter's company or create a new job opening.
    Enforces strict company data isolation.
    """
    permission_classes = [IsRecruiter]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'employment_type', 'experience_level']
    search_fields = ['title', 'location', 'skills']
    ordering_fields = ['created_at', 'views_count', 'applications_count', 'title']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JobCreateUpdateSerializer
        return RecruiterJobManageSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Job.objects.none()
        return Job.objects.filter(company=profile.company).select_related('company')


class RecruiterJobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a job opening.
    Recruiter must belong to the same company.
    """
    permission_classes = [IsRecruiter]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return JobCreateUpdateSerializer
        return JobPublicDetailSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Job.objects.none()
        return Job.objects.filter(company=profile.company)


class RecruiterJobStatusChangeView(APIView):
    """
    Quickly toggle or change job status (e.g. PUBLISHED, CLOSED, ARCHIVED, DRAFT).
    """
    permission_classes = [IsRecruiter]

    def patch(self, request, pk):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Response(
                {"error": "No company associated with this account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        job = get_object_or_404(Job, pk=pk, company=profile.company)
        new_status = request.data.get('status')
        if new_status not in Job.Status.values:
            return Response(
                {"error": f"Invalid status. Choose from: {list(Job.Status.values)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        job.status = new_status
        job.save()
        return Response({
            "message": f"Job status updated to {job.get_status_display()}.",
            "status": job.status
        })
