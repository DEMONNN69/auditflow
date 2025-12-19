from django.db import models
from apps.core.models.base import TimeStampedModel
from apps.users.models.user import CustomUser
from apps.transactions.models.transaction import Transaction

class AuditLog(TimeStampedModel):
    EVENT_TYPES = [
        ('transaction_created', 'Transaction Created'),
        ('transaction_completed', 'Transaction Completed'),
        ('transaction_failed', 'Transaction Failed'),
        ('balance_updated', 'Balance Updated'),
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('account_created', 'Account Created'),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    description = models.TextField()
    data = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_immutable = models.BooleanField(default=True, editable=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.created_at}"

    def save(self, *args, **kwargs):
        if self.pk:
            raise Exception("Audit logs are immutable and cannot be modified")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise Exception("Audit logs are immutable and cannot be deleted")
