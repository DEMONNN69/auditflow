from rest_framework import serializers
from apps.transactions.models.transaction import Account, Transaction, Balance

class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'account_number', 'account_type', 'balance', 'is_active', 'created_at']
        read_only_fields = ['id', 'balance', 'created_at']

class TransactionSerializer(serializers.ModelSerializer):
    from_account_number = serializers.CharField(source='from_account.account_number', read_only=True)
    to_account_number = serializers.CharField(source='to_account.account_number', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'from_account', 'from_account_number', 'to_account', 'to_account_number', 
                  'amount', 'transaction_type', 'status', 'description', 'reference_id', 'created_at']
        read_only_fields = ['id', 'status', 'reference_id', 'created_at']

class BalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Balance
        fields = ['id', 'account', 'current_balance', 'previous_balance', 'created_at']
        read_only_fields = ['id', 'created_at']
