"""
URLs for jobs app.
"""
from django.urls import path
from .views import (
    JobPublicListView,
    JobPublicDetailView,
    RecruiterJobListCreateView,
    RecruiterJobDetailView,
    RecruiterJobStatusChangeView
)

urlpatterns = [
    # Public endpoints
    path('', JobPublicListView.as_view(), name='job_public_list'),
    path('recruiter/', RecruiterJobListCreateView.as_view(), name='recruiter_job_list_create'),
    path('recruiter/<int:pk>/', RecruiterJobDetailView.as_view(), name='recruiter_job_detail'),
    path('recruiter/<int:pk>/status/', RecruiterJobStatusChangeView.as_view(), name='recruiter_job_status'),
    path('<slug:slug>/', JobPublicDetailView.as_view(), name='job_public_detail'),
]
