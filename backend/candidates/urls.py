"""
URLs for candidates app.
"""
from django.urls import path
from .views import (
    CandidateProfileView,
    ResumeListCreateView,
    ResumeDetailView,
    SetPrimaryResumeView,
    SecureResumeDownloadView
)

urlpatterns = [
    path('profile/', CandidateProfileView.as_view(), name='candidate_profile'),
    path('resumes/', ResumeListCreateView.as_view(), name='resume_list_create'),
    path('resumes/<int:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('resumes/<int:pk>/set-primary/', SetPrimaryResumeView.as_view(), name='resume_set_primary'),
    path('resumes/<int:pk>/download/', SecureResumeDownloadView.as_view(), name='resume_download'),
]
