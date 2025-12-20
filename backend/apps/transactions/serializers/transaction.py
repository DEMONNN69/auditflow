from rest_framework import serializers
from apps.transactions.models.transaction import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    from_user_name = serializers.SerializerMethodField()
    to_user_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 
            'from_user', 
            'from_recipient_id',
            'from_user_name',
            'to_user', 
            'to_recipient_id',
            'to_user_name',
            'amount', 
            'transaction_type', 
            'status', 
            'description', 
            'reference_id', 
            'created_at'
        ]
        read_only_fields = ['id', 'status', 'reference_id', 'from_recipient_id', 'to_recipient_id', 'created_at']
    
    def get_from_user_name(self, obj):
        if obj.from_user:
            return f"{obj.from_user.first_name} {obj.from_user.last_name}".strip()
        return None
    
    def get_to_user_name(self, obj):
        return f"{obj.to_user.first_name} {obj.to_user.last_name}".strip()
