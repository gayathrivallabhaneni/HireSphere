"""
Job filtering with django-filter.
"""
import django_filters
from django.db.models import Q
from .models import Job

class JobFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_search')
    location = django_filters.CharFilter(field_name='location', lookup_expr='icontains')
    experience_level = django_filters.ChoiceFilter(choices=Job.ExperienceLevel.choices)
    employment_type = django_filters.ChoiceFilter(choices=Job.EmploymentType.choices)
    work_mode = django_filters.ChoiceFilter(choices=Job.WorkMode.choices)
    min_salary = django_filters.NumberFilter(field_name='min_salary', lookup_expr='gte')
    max_salary = django_filters.NumberFilter(field_name='max_salary', lookup_expr='lte')
    company = django_filters.CharFilter(method='filter_company')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')

    class Meta:
        model = Job
        fields = [
            'search', 'location', 'experience_level',
            'employment_type', 'work_mode', 'min_salary',
            'max_salary', 'company', 'is_featured'
        ]

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        val = value.strip()
        return queryset.filter(
            Q(title__icontains=val) |
            Q(description__icontains=val) |
            Q(company__name__icontains=val) |
            Q(skills__icontains=val) |
            Q(location__icontains=val)
        )

    def filter_company(self, queryset, name, value):
        if value.isdigit():
            return queryset.filter(company_id=int(value))
        return queryset.filter(company__slug=value)
