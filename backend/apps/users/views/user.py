from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.users.models.user import CustomUser
from apps.users.serializers.user import UserSerializer, UserRegistrationSerializer, RecipientInfoSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'get_recipient']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action == 'get_recipient':
            return RecipientInfoSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny], url_path='recipient/(?P<recipient_id>[^/.]+)')
    def get_recipient(self, request, recipient_id=None):
        """Fetch recipient info by recipient_id"""
        try:
            user = CustomUser.objects.get(recipient_id=recipient_id)
            serializer = RecipientInfoSerializer(user)
            return Response(serializer.data)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'Recipient not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})
