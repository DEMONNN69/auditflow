from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from apps.core.models.base import TimeStampedModel, AuditableModel
from apps.users.models.user import CustomUser

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

    from_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        related_name='sent_transactions', 
        null=True, 
        blank=True
    )
    from_recipient_id = models.CharField(max_length=10, blank=True, default='')
    
    to_user = models.ForeignKey(
        CustomUser, 
        on_delete=models.PROTECT, 
        related_name='received_transactions'
    )
    to_recipient_id = models.CharField(max_length=10, default='0000000000')
    
    amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='pending')
    description = models.TextField(blank=True)
    transaction_hash = models.CharField(max_length=64, unique=True, editable=False)
    reference_id = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Transaction {self.reference_id}"
