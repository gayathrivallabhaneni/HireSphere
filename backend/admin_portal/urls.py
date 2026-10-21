"""
URLs for admin portal app.
"""
from django.urls import path
from .views import (
    AdminDashboardStatsView,
    AdminUsersListView,
    AdminToggleUserActiveView,
    AdminCompaniesListView,
    AdminVerifyCompanyView,
    AdminToggleCompanyActiveView,
    AdminJobsListView,
    AdminModerateJobView,
)

urlpatterns = [
    path('stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('users/', AdminUsersListView.as_view(), name='admin_users_list'),
    path('users/<int:pk>/toggle-active/', AdminToggleUserActiveView.as_view(), name='admin_toggle_user_active'),
    path('companies/', AdminCompaniesListView.as_view(), name='admin_companies_list'),
    path('companies/<int:pk>/verify/', AdminVerifyCompanyView.as_view(), name='admin_verify_company'),
    path('companies/<int:pk>/toggle-active/', AdminToggleCompanyActiveView.as_view(), name='admin_toggle_company_active'),
    path('jobs/', AdminJobsListView.as_view(), name='admin_jobs_list'),
    path('jobs/<int:pk>/moderate/', AdminModerateJobView.as_view(), name='admin_moderate_job'),
]
