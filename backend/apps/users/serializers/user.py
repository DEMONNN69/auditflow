from rest_framework import serializers
from apps.users.models.user import CustomUser

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'recipient_id', 'first_name', 'last_name', 'full_name', 'phone', 'balance', 'is_verified', 'created_at']
        read_only_fields = ['id', 'recipient_id', 'balance', 'created_at']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class RecipientInfoSerializer(serializers.ModelSerializer):
    """Serializer for fetching recipient info by recipient_id"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['recipient_id', 'first_name', 'last_name', 'full_name', 'email']
        read_only_fields = ['recipient_id', 'first_name', 'last_name', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match"})
        return data

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user
