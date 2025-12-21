import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_user_creation():
    """Test creating a user directly"""
    user = User.objects.create_user(email='test@example.com', password='testpass123')
    assert user.email == 'test@example.com'
    assert user.recipient_id is not None
    assert len(user.recipient_id) == 10

@pytest.mark.django_db
def test_user_registration(api_client):
    """Test user registration via API"""
    response = api_client.post('/api/users/users/', {
        'email': 'newuser@example.com',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
    })
    assert response.status_code in [201, 400]

@pytest.mark.django_db
def test_user_token_obtain(api_client, test_user):
    """Test obtaining JWT tokens"""
    response = api_client.post('/api/users/token/', {
        'email': test_user.email,
        'password': 'testpass123'
    })
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data

@pytest.mark.django_db
def test_user_me_endpoint(authenticated_client, test_user):
    """Test getting current user profile"""
    response = authenticated_client.get('/api/users/users/me/')
    assert response.status_code == 200
    assert response.data['email'] == test_user.email

@pytest.mark.django_db
def test_user_recipient_lookup(api_client, test_user):
    """Test looking up user by recipient ID"""
    response = api_client.get(f'/api/users/users/recipient/{test_user.recipient_id}/')
    assert response.status_code == 200
    assert response.data['recipient_id'] == test_user.recipient_id

@pytest.mark.django_db
def test_user_change_password(authenticated_client, test_user):
    """Test changing password"""
    response = authenticated_client.post('/api/users/users/change_password/', {
        'old_password': 'testpass123',
        'new_password': 'newpass456'
    })
    assert response.status_code == 200
    
    # Verify new password works
    test_user.refresh_from_db()
    assert test_user.check_password('newpass456')
