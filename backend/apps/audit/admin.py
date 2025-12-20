from django.contrib import admin
from apps.audit.models.audit_log import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'event_type',
        'user',
        'transaction',
        'ip_address',
        'created_at',
        'is_immutable'
    ]
    list_filter = ['event_type', 'is_immutable', 'created_at']
    search_fields = [
        'user__email',
        'ip_address',
        'description'
    ]
    readonly_fields = [
        'id',
        'event_type',
        'user',
        'transaction',
        'description',
        'data',
        'ip_address',
        'user_agent',
        'created_at',
        'updated_at',
        'is_immutable'
    ]
    ordering = ['-created_at']
    
    # Make it read-only since audit logs should not be modified
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
