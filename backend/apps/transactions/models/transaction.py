from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models.base import TimeStampedModel, AuditableModel
from apps.users.models.user import CustomUser

class Account(AuditableModel):
    ACCOUNT_TYPES = [
        ('checking', 'Checking'),
        ('savings', 'Savings'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='account')
    account_number = models.CharField(max_length=20, unique=True)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES, default='checking')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0, validators=[MinValueValidator(Decimal('0.00'))])
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.account_number}"

class Transaction(AuditableModel):
    TRANSACTION_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    TRANSACTION_TYPES = [
        ('transfer', 'Transfer'),
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
    ]

    from_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='sent_transactions', null=True, blank=True)
    to_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='received_transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='pending')
    description = models.TextField(blank=True)
    transaction_hash = models.CharField(max_length=64, unique=True, editable=False)
    reference_id = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.reference_id}"

class Balance(TimeStampedModel):
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='balance_record')
    current_balance = models.DecimalField(max_digits=15, decimal_places=2)
    previous_balance = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.account.account_number} - {self.current_balance}"
