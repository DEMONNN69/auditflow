import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_user():
    user = User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        username='testuser'
    )
    # Ensure balance is set
    user.balance = Decimal('500.00')
    user.save()
    return user

@pytest.fixture
def authenticated_client(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    return api_client

@pytest.fixture
def another_user():
    """Create a second test user for transaction tests"""
    user = User.objects.create_user(
        email='another@example.com',
        password='testpass123',
        username='anotheruser'
    )
    user.balance = Decimal('500.00')
    user.save()
    return user
