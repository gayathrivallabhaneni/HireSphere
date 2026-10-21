"""
URLs for applications app.
"""
from django.urls import path
from .views import (
    CandidateApplyJobView,
    CandidateApplicationsListView,
    CandidateApplicationDetailView,
    CandidateWithdrawApplicationView,
    CandidateDashboardStatsView,
    RecruiterApplicationsListView,
    RecruiterApplicationDetailView,
    RecruiterUpdateStatusView,
    RecruiterNotesListCreateView,
    RecruiterDashboardStatsView,
)

urlpatterns = [
    # Candidate endpoints
    path('apply/', CandidateApplyJobView.as_view(), name='candidate_apply'),
    path('candidate/my-applications/', CandidateApplicationsListView.as_view(), name='candidate_applications_list'),
    path('candidate/my-applications/<int:pk>/', CandidateApplicationDetailView.as_view(), name='candidate_application_detail'),
    path('candidate/my-applications/<int:pk>/withdraw/', CandidateWithdrawApplicationView.as_view(), name='candidate_withdraw_application'),
    path('candidate/dashboard-stats/', CandidateDashboardStatsView.as_view(), name='candidate_dashboard_stats'),

    # Recruiter endpoints
    path('recruiter/applications/', RecruiterApplicationsListView.as_view(), name='recruiter_applications_list'),
    path('recruiter/applications/<int:pk>/', RecruiterApplicationDetailView.as_view(), name='recruiter_application_detail'),
    path('recruiter/applications/<int:pk>/status/', RecruiterUpdateStatusView.as_view(), name='recruiter_update_status'),
    path('recruiter/applications/<int:pk>/notes/', RecruiterNotesListCreateView.as_view(), name='recruiter_application_notes'),
    path('recruiter/dashboard-stats/', RecruiterDashboardStatsView.as_view(), name='recruiter_dashboard_stats'),
]
