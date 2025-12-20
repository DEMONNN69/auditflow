from django.contrib import admin
from apps.transactions.models.transaction import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = [
        'reference_id', 
        'from_user', 
        'from_recipient_id',
        'to_user', 
        'to_recipient_id',
        'amount', 
        'transaction_type', 
        'status', 
        'created_at'
    ]
    list_filter = ['status', 'transaction_type', 'created_at']
    search_fields = [
        'reference_id', 
        'from_recipient_id', 
        'to_recipient_id',
        'from_user__email', 
        'to_user__email',
        'transaction_hash'
    ]
    readonly_fields = [
        'reference_id', 
        'transaction_hash', 
        'from_recipient_id',
        'to_recipient_id',
        'created_at', 
        'updated_at'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Transaction Info', {
            'fields': ('reference_id', 'transaction_hash', 'transaction_type', 'status')
        }),
        ('Sender Info', {
            'fields': ('from_user', 'from_recipient_id')
        }),
        ('Recipient Info', {
            'fields': ('to_user', 'to_recipient_id')
        }),
        ('Amount & Description', {
            'fields': ('amount', 'description')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
