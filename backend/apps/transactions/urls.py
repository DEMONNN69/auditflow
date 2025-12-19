from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.transactions.views.transaction import AccountViewSet, TransactionViewSet, BalanceViewSet

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'balances', BalanceViewSet, basename='balance')

urlpatterns = [
    path('', include(router.urls)),
]
