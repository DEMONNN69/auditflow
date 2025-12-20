from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.users.models.user import CustomUser, UserProfile

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'recipient_id', 'balance', 'first_name', 'last_name', 'is_verified', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_verified', 'is_active']
    search_fields = ['email', 'recipient_id', 'first_name', 'last_name']
    ordering = ['-created_at']
    readonly_fields = ['recipient_id', 'created_at', 'updated_at', 'last_login', 'date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Financial Info', {'fields': ('recipient_id', 'balance')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'phone'),
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'country', 'created_at']
    search_fields = ['user__email', 'city', 'country']
    readonly_fields = ['created_at', 'updated_at']
