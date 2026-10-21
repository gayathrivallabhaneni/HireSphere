"""
Views for Application submission, tracking, recruiter workflows, and statistics.
"""
from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db.models import Count, Q

from .models import JobApplication, ApplicationStatusHistory, RecruiterNote
from .serializers import (
    JobApplicationCreateSerializer,
    CandidateApplicationListSerializer,
    CandidateApplicationDetailSerializer,
    RecruiterApplicationListSerializer,
    RecruiterApplicationDetailSerializer,
    ApplicationStatusUpdateSerializer,
    RecruiterNoteSerializer
)
from common.permissions import IsCandidate, IsRecruiter, IsAdminRole
from common.pagination import StandardResultsSetPagination
from jobs.models import Job

# ----------------------------------------------------
# Candidate Views
# ----------------------------------------------------

class CandidateApplyJobView(generics.CreateAPIView):
    """
    Candidate submits an application to an active job opening.
    """
    permission_classes = [IsCandidate]
    serializer_class = JobApplicationCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(
            {
                "message": "Application submitted successfully!",
                "id": application.id,
                "application_id": application.id,
                "status": application.status
            },
            status=status.HTTP_201_CREATED
        )


class CandidateApplicationsListView(generics.ListAPIView):
    """
    List all applications submitted by authenticated candidate.
    """
    permission_classes = [IsCandidate]
    serializer_class = CandidateApplicationListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['applied_at', 'updated_at']
    ordering = ['-applied_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(
            candidate=self.request.user
        ).select_related('job', 'job__company', 'resume')


class CandidateApplicationDetailView(generics.RetrieveAPIView):
    """
    Retrieve single application details and status audit history for candidate.
    Never exposes recruiter notes.
    """
    permission_classes = [IsCandidate]
    serializer_class = CandidateApplicationDetailSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(
            candidate=self.request.user
        ).select_related('job', 'job__company', 'resume').prefetch_related('status_history')


class CandidateWithdrawApplicationView(APIView):
    """
    Allow candidate to withdraw their application.
    Permitted if application is in APPLIED or UNDER_REVIEW status.
    """
    permission_classes = [IsCandidate]

    def post(self, request, pk):
        application = get_object_or_404(JobApplication, pk=pk, candidate=request.user)

        if application.status in [JobApplication.Status.OFFERED, JobApplication.Status.REJECTED, JobApplication.Status.WITHDRAWN]:
            return Response(
                {"error": f"Cannot withdraw an application that is already '{application.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            old_status = application.status
            application.status = JobApplication.Status.WITHDRAWN
            application.save()

            ApplicationStatusHistory.objects.create(
                application=application,
                from_status=old_status,
                to_status=JobApplication.Status.WITHDRAWN,
                changed_by=request.user,
                notes=request.data.get('notes', 'Application withdrawn by candidate.')
            )

        return Response({"message": "Application withdrawn successfully.", "status": application.status})


class CandidateDashboardStatsView(APIView):
    """
    Metrics and breakdown for Candidate Dashboard.
    """
    permission_classes = [IsCandidate]

    def get(self, request):
        user = request.user
        apps = JobApplication.objects.filter(candidate=user)

        stats = {
            'total_applications': apps.count(),
            'under_review': apps.filter(status=JobApplication.Status.UNDER_REVIEW).count(),
            'shortlisted': apps.filter(status=JobApplication.Status.SHORTLISTED).count(),
            'interview_scheduled': apps.filter(status=JobApplication.Status.INTERVIEW_SCHEDULED).count(),
            'offers_received': apps.filter(status=JobApplication.Status.OFFERED).count(),
            'rejected': apps.filter(status=JobApplication.Status.REJECTED).count(),
            'withdrawn': apps.filter(status=JobApplication.Status.WITHDRAWN).count(),
        }

        # Include 5 recent applications
        recent = CandidateApplicationListSerializer(
            apps.select_related('job', 'job__company', 'resume')[:5],
            many=True,
            context={'request': request}
        ).data

        return Response({
            'metrics': stats,
            'recent_applications': recent
        })


# ----------------------------------------------------
# Recruiter Views
# ----------------------------------------------------

class RecruiterApplicationsListView(generics.ListAPIView):
    """
    List applications submitted to recruiter company's jobs.
    Filterable by job_id, status, search candidate name/email.
    """
    permission_classes = [IsRecruiter]
    serializer_class = RecruiterApplicationListSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'status']
    search_fields = ['candidate__first_name', 'candidate__last_name', 'candidate__email', 'job__title']
    ordering_fields = ['applied_at', 'status']
    ordering = ['-applied_at']

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(
            job__company=profile.company
        ).select_related('job', 'candidate', 'resume').prefetch_related('notes')


class RecruiterApplicationDetailView(generics.RetrieveAPIView):
    """
    Detailed candidate application review for recruiter, including status history and notes.
    """
    permission_classes = [IsRecruiter]
    serializer_class = RecruiterApplicationDetailSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return JobApplication.objects.none()
        return JobApplication.objects.filter(
            job__company=profile.company
        ).select_related('job', 'candidate', 'resume').prefetch_related('status_history', 'notes')


class RecruiterUpdateStatusView(APIView):
    """
    Update candidate application status with audit trail.
    """
    permission_classes = [IsRecruiter]

    def post(self, request, pk):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Response(
                {"error": "No company associated with this recruiter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        application = get_object_or_404(JobApplication, pk=pk, job__company=profile.company)

        if application.status == JobApplication.Status.WITHDRAWN:
            return Response(
                {"error": "Cannot change the status of an application that was withdrawn by the candidate."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ApplicationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        if new_status == JobApplication.Status.WITHDRAWN:
            return Response(
                {"error": "Only candidates may withdraw their own applications."},
                status=status.HTTP_400_BAD_REQUEST
            )
        notes = serializer.validated_data.get('notes', '')

        if application.status == new_status:
            return Response({"message": f"Status is already {new_status}."}, status=status.HTTP_200_OK)

        with transaction.atomic():
            old_status = application.status
            application.status = new_status
            application.save()

            ApplicationStatusHistory.objects.create(
                application=application,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                notes=notes or f"Status changed to {application.get_status_display()} by {request.user.get_full_name()}."
            )

        return Response({
            "message": f"Application status updated to {application.get_status_display()}.",
            "status": application.status
        })


class RecruiterNotesListCreateView(generics.ListCreateAPIView):
    """
    List and add private recruiter notes for an application.
    Enforces strict company isolation on the application.
    """
    permission_classes = [IsRecruiter]
    serializer_class = RecruiterNoteSerializer

    def get_application(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            raise Http404("No company associated with this recruiter.")
        return get_object_or_404(
            JobApplication,
            pk=self.kwargs['pk'],
            job__company=profile.company
        )

    def get(self, request, *args, **kwargs):
        self.get_application()
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return RecruiterNote.objects.none()
        app_id = self.kwargs['pk']
        return RecruiterNote.objects.filter(
            application_id=app_id,
            application__job__company=profile.company
        ).select_related('recruiter')

    def perform_create(self, serializer):
        application = self.get_application()
        serializer.save(application=application, recruiter=self.request.user)


class RecruiterDashboardStatsView(APIView):
    """
    Metrics and breakdown for Recruiter Dashboard.
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Response({
                'company': None,
                'metrics': {
                    'total_jobs': 0, 'active_jobs': 0, 'total_applications': 0,
                    'under_review': 0, 'shortlisted': 0, 'interview_scheduled': 0, 'offers': 0
                },
                'recent_applications': []
            })

        company = profile.company
        jobs = Job.objects.filter(company=company)
        apps = JobApplication.objects.filter(job__company=company)

        stats = {
            'total_jobs': jobs.count(),
            'active_jobs': jobs.filter(status=Job.Status.PUBLISHED).count(),
            'total_applications': apps.count(),
            'under_review': apps.filter(status=JobApplication.Status.UNDER_REVIEW).count(),
            'shortlisted': apps.filter(status=JobApplication.Status.SHORTLISTED).count(),
            'interview_scheduled': apps.filter(status=JobApplication.Status.INTERVIEW_SCHEDULED).count(),
            'offers': apps.filter(status=JobApplication.Status.OFFERED).count(),
            'rejected': apps.filter(status=JobApplication.Status.REJECTED).count(),
        }

        recent = RecruiterApplicationListSerializer(
            apps.select_related('job', 'candidate', 'resume')[:6],
            many=True
        ).data

        return Response({
            'company': {
                'id': company.id,
                'name': company.name,
                'slug': company.slug,
                'logo': company.logo.url if company.logo else None,
                'industry': company.industry
            },
            'metrics': stats,
            'recent_applications': recent
        })
