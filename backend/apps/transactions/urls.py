from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.transactions.views.transaction import TransactionViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
]
