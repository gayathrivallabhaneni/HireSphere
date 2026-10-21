import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
class TestAuthentication:
    def setup_method(self):
        self.client = APIClient()

    def test_candidate_registration(self):
        url = reverse('auth_register')
        data = {
            'email': 'new_candidate@test.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'role': 'CANDIDATE',
            'phone_number': '+15551234567'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == 'new_candidate@test.com'
        assert response.data['user']['role'] == 'CANDIDATE'

    def test_recruiter_registration_with_company(self):
        url = reverse('auth_register')
        data = {
            'email': 'new_recruiter@test.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'John',
            'last_name': 'Smith',
            'role': 'RECRUITER',
            'company_name': 'Apex Innovations',
            'company_industry': 'Artificial Intelligence',
            'company_location': 'Seattle, WA'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['user']['role'] == 'RECRUITER'
        assert response.data['user']['company_details']['name'] == 'Apex Innovations'

    def test_password_mismatch_fails(self):
        url = reverse('auth_register')
        data = {
            'email': 'bad_pw@test.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'DifferentPassword123!',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'CANDIDATE'
        }
        response = self.client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.data

    def test_login_and_token_refresh(self):
        user = User.objects.create_user(
            email='login_user@test.com',
            password='TestPassword123!',
            role='CANDIDATE'
        )
        login_url = reverse('auth_login')
        response = self.client.post(login_url, {
            'email': 'login_user@test.com',
            'password': 'TestPassword123!'
        })
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data

        # Refresh token
        refresh_url = reverse('token_refresh')
        refresh_response = self.client.post(refresh_url, {'refresh': response.data['refresh']})
        assert refresh_response.status_code == status.HTTP_200_OK
        assert 'access' in refresh_response.data
