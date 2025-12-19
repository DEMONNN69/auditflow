import pytest
from apps.audit.models.audit_log import AuditLog
from apps.audit.services.audit_service import AuditService

@pytest.mark.django_db
def test_audit_log_creation(test_user):
    log = AuditService.log_event(
        event_type='user_login',
        user=test_user,
        description='User logged in'
    )
    assert log.event_type == 'user_login'
    assert log.user == test_user
