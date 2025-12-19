from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.core.models.base import TimeStampedModel

class CustomUser(AbstractUser, TimeStampedModel):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'auth_user'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

class UserProfile(TimeStampedModel):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.email} Profile"
