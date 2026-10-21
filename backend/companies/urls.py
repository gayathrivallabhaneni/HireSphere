"""
URLs for companies app.
"""
from django.urls import path
from .views import (
    CompanyListView,
    CompanyDetailView,
    MyCompanyView,
    CompanyRecruitersListView
)

urlpatterns = [
    path('', CompanyListView.as_view(), name='company_list'),
    path('my-company/', MyCompanyView.as_view(), name='my_company'),
    path('my-recruiters/', CompanyRecruitersListView.as_view(), name='company_recruiters'),
    path('<slug:slug>/', CompanyDetailView.as_view(), name='company_detail'),
]
