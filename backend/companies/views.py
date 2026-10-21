"""
Views for Company listings and recruiter company management.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Company, RecruiterProfile
from .serializers import CompanySerializer, RecruiterProfileSerializer
from common.permissions import IsRecruiter, IsAdminRole

class CompanyListView(generics.ListAPIView):
    """
    Public listing of active companies with job openings.
    """
    queryset = Company.objects.filter(is_active=True).order_by('name')
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ['name', 'industry', 'location']


class CompanyDetailView(generics.RetrieveAPIView):
    """
    Public company profile details by slug.
    """
    queryset = Company.objects.filter(is_active=True)
    serializer_class = CompanySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class MyCompanyView(APIView):
    """
    Retrieve or update the authenticated recruiter's company profile.
    """
    permission_classes = [IsRecruiter]

    def get(self, request):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Response(
                {"error": "No company associated with this recruiter account."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = CompanySerializer(profile.company)
        return Response(serializer.data)

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        profile = getattr(request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return Response(
                {"error": "No company associated with this recruiter account."},
                status=status.HTTP_404_NOT_FOUND
            )
        if not profile.is_company_admin:
            return Response(
                {"error": "Only company administrators can update the company profile."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CompanySerializer(profile.company, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CompanyRecruitersListView(generics.ListAPIView):
    """
    List all recruiters associated with the requesting recruiter's company.
    """
    permission_classes = [IsRecruiter]
    serializer_class = RecruiterProfileSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'recruiter_profile', None)
        if not profile or not profile.company:
            return RecruiterProfile.objects.none()
        return RecruiterProfile.objects.filter(company=profile.company).select_related('user', 'company')
