"""
Role-based and object-level permissions.
"""
from rest_framework import permissions

class IsCandidate(permissions.BasePermission):
    """Allows access only to candidate users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'CANDIDATE'
        )

class IsRecruiter(permissions.BasePermission):
    """Allows access only to recruiter users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'RECRUITER'
        )

class IsAdminRole(permissions.BasePermission):
    """Allows access only to platform administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class IsRecruiterOrAdmin(permissions.BasePermission):
    """Allows access to recruiters or administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['RECRUITER', 'ADMIN'] or request.user.is_staff)
        )

class IsCandidateOrAdmin(permissions.BasePermission):
    """Allows access to candidates or administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['CANDIDATE', 'ADMIN'] or request.user.is_staff)
        )
