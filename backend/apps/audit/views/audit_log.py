from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.audit.models.audit_log import AuditLog
from apps.audit.serializers.audit_log import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = AuditLog.objects.all()
        event_type = self.request.query_params.get('event_type')
        user_id = self.request.query_params.get('user_id')

        # Non-staff users only see their own logs
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        else:
            if user_id:
                queryset = queryset.filter(user_id=user_id)

        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_logs(self, request):
        logs = AuditLog.objects.filter(user=request.user)
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
