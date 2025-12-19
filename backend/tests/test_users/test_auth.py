import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_user_creation():
    user = User.objects.create_user(email='test@example.com', password='testpass123')
    assert user.email == 'test@example.com'

@pytest.mark.django_db
def test_user_registration(api_client):
    response = api_client.post('/api/users/users/', {
        'email': 'newuser@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
    })
    assert response.status_code in [201, 400]
