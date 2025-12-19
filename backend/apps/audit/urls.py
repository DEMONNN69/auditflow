from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.audit.views.audit_log import AuditLogViewSet

router = DefaultRouter()
router.register(r'logs', AuditLogViewSet, basename='audit_log')

urlpatterns = [
    path('', include(router.urls)),
]
