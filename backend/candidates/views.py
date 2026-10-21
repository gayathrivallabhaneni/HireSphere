"""
Views for candidate profiles and secure resume management.
"""
import os
from django.http import FileResponse, Http404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404

from .models import CandidateProfile, Resume
from .serializers import (
    CandidateProfileSerializer,
    ResumeSerializer,
    ResumeUploadSerializer
)
from common.permissions import IsCandidate, IsAdminRole
from applications.models import JobApplication

class CandidateProfileView(APIView):
    """
    Retrieve or update authenticated candidate's profile.
    """
    permission_classes = [IsCandidate]

    def get(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        profile, _ = CandidateProfile.objects.get_or_create(user=request.user)
        serializer = CandidateProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ResumeListCreateView(generics.ListCreateAPIView):
    """
    List candidate's uploaded resumes or upload a new resume.
    """
    permission_classes = [IsCandidate]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ResumeUploadSerializer
        return ResumeSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Resume.objects.none()
        return Resume.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # If this is the user's first resume, make it primary automatically
        is_first = not Resume.objects.filter(user=self.request.user).exists()
        if is_first:
            serializer.save(is_primary=True)
        else:
            serializer.save()


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    """
    Retrieve details or delete a candidate's resume.
    """
    permission_classes = [IsCandidate]
    serializer_class = ResumeSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return Resume.objects.none()
        return Resume.objects.filter(user=self.request.user)

    def delete(self, request, *args, **kwargs):
        resume = self.get_object()
        # Protect if resume is referenced in pending/active applications
        if resume.applications.exists():
            return Response(
                {"error": "Cannot delete resume because it is associated with submitted job applications."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().delete(request, *args, **kwargs)


class SetPrimaryResumeView(APIView):
    """
    Set a specific resume as primary.
    """
    permission_classes = [IsCandidate]

    def post(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        Resume.objects.filter(user=request.user).update(is_primary=False)
        resume.is_primary = True
        resume.save()
        return Response({"message": "Resume set as primary.", "resume_id": resume.id})


class SecureResumeDownloadView(APIView):
    """
    Secure endpoint for downloading a candidate resume.
    Access is granted ONLY to:
    1. The candidate who owns the resume.
    2. A recruiter belonging to a company where the candidate submitted an application referencing this resume.
    3. Platform administrators.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        resume = get_object_or_404(Resume, pk=pk)
        user = request.user

        # 1. Candidate owner
        if user == resume.user:
            authorized = True
        # 2. Administrator
        elif user.role == 'ADMIN' or user.is_staff or user.is_superuser:
            authorized = True
        # 3. Authorized Recruiter check
        elif user.role == 'RECRUITER' and hasattr(user, 'recruiter_profile') and user.recruiter_profile.company:
            recruiter_company = user.recruiter_profile.company
            authorized = JobApplication.objects.filter(
                resume=resume,
                job__company=recruiter_company
            ).exists()
        else:
            authorized = False

        if not authorized:
            return Response(
                {"error": "You do not have authorization to access or download this resume."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not resume.file:
            raise Http404("Resume file not found.")

        try:
            file_handle = resume.file.open('rb')
        except (FileNotFoundError, ValueError, OSError):
            raise Http404("Resume file not found on storage.")

        filename = resume.original_filename or os.path.basename(resume.file.name)
        response = FileResponse(file_handle, content_type=resume.file_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
