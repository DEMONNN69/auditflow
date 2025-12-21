import pytest
from apps.audit.models.audit_log import AuditLog
from apps.audit.services.audit_service import AuditService

@pytest.mark.django_db
def test_audit_log_creation(test_user):
    """Test creating an audit log entry"""
    log = AuditService.log_event(
        event_type='user_login',
        user=test_user,
        description='User logged in'
    )
    assert log.event_type == 'user_login'
    assert log.user == test_user

@pytest.mark.django_db
def test_audit_log_immutable(test_user):
    """Test that audit logs cannot be modified"""
    log = AuditService.log_event(
        event_type='transaction_completed',
        user=test_user,
        description='Transfer of 100.00'
    )
    
    # Verify log was created
    original_description = log.description
    assert original_description == 'Transfer of 100.00'
    
    # Attempt to modify should raise exception
    log.description = 'Modified'
    with pytest.raises(Exception, match="Audit logs are immutable"):
        log.save()

@pytest.mark.django_db
def test_audit_logs_api_list(authenticated_client, test_user):
    """Test listing audit logs via API"""
    # Create a log first
    AuditService.log_event(
        event_type='test_event',
        user=test_user,
        description='Test audit entry'
    )
    
    response = authenticated_client.get('/api/audit/logs/')
    assert response.status_code == 200
    assert 'results' in response.data or isinstance(response.data, list)

@pytest.mark.django_db
def test_audit_logs_api_my_logs(authenticated_client, test_user):
    """Test retrieving current user's audit logs"""
    response = authenticated_client.get('/api/audit/logs/my_logs/')
    assert response.status_code == 200
