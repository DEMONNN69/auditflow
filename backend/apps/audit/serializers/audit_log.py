from rest_framework import serializers
from apps.audit.models.audit_log import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    transaction_reference = serializers.CharField(source='transaction.reference_id', read_only=True, allow_null=True)
    
    # Transaction detail fields extracted from data
    sender_id = serializers.SerializerMethodField()
    receiver_id = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    transaction_type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    from_user_name = serializers.SerializerMethodField()
    to_user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'event_type', 'user', 'user_email', 'transaction', 'transaction_reference',
            'sender_id', 'receiver_id', 'amount', 'transaction_type', 'status',
            'from_user_name', 'to_user_name',
            'description', 'data', 'ip_address', 'created_at', 'is_immutable'
        ]
        read_only_fields = ['id', 'created_at', 'is_immutable']
    
    def get_sender_id(self, obj):
        return obj.data.get('from_recipient_id') or obj.data.get('from_user_id')
    
    def get_receiver_id(self, obj):
        return obj.data.get('to_recipient_id')
    
    def get_amount(self, obj):
        return obj.data.get('amount')
    
    def get_transaction_type(self, obj):
        return obj.data.get('transaction_type', '')
    
    def get_status(self, obj):
        return obj.data.get('status', '')
    
    def get_from_user_name(self, obj):
        return obj.data.get('from_user_name', '')
    
    def get_to_user_name(self, obj):
        return obj.data.get('to_user_name', '')
