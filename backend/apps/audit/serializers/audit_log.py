from rest_framework import serializers
from apps.audit.models.audit_log import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    transaction_reference = serializers.CharField(source='transaction.reference_id', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'event_type', 'user', 'user_email', 'transaction', 'transaction_reference', 
                  'description', 'data', 'ip_address', 'created_at', 'is_immutable']
        read_only_fields = ['id', 'created_at', 'is_immutable']
