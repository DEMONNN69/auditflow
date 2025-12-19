from apps.audit.models.audit_log import AuditLog
from django.contrib.auth import get_user_model
from apps.transactions.models.transaction import Transaction

User = get_user_model()

class AuditService:
    @staticmethod
    def log_event(event_type, user=None, transaction=None, description="", data=None, request=None):
        audit_log = AuditLog.objects.create(
            event_type=event_type,
            user=user,
            transaction=transaction,
            description=description,
            data=data or {},
            ip_address=AuditService.get_client_ip(request) if request else None,
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
        )
        return audit_log

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @staticmethod
    def get_audit_logs(event_type=None, user=None, transaction=None):
        queryset = AuditLog.objects.all()
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        if user:
            queryset = queryset.filter(user=user)
        if transaction:
            queryset = queryset.filter(transaction=transaction)
        return queryset
