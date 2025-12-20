from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
import random
from apps.core.models.base import TimeStampedModel

class CustomUserManager(BaseUserManager):
    def _generate_recipient_id(self):
        """Generate a unique 10-digit recipient ID"""
        while True:
            # Generate 10-digit number (1000000000 to 9999999999)
            recipient_id = str(random.randint(1000000000, 9999999999))
            if not CustomUser.objects.filter(recipient_id=recipient_id).exists():
                return recipient_id
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('username', email)
        
        # Auto-generate recipient_id if not provided
        if 'recipient_id' not in extra_fields:
            extra_fields['recipient_id'] = self._generate_recipient_id()
        
        # Set default balance to 500.00
        extra_fields.setdefault('balance', Decimal('500.00'))
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser, TimeStampedModel):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    recipient_id = models.CharField(max_length=10, unique=True, editable=False, db_index=True)
    balance = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=Decimal('500.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
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
