from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.transactions.views.transaction import TransactionViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    # Clean aliases without the repeated segment:
    # /api/transactions/ (list/create) and /api/transactions/<int:pk>/ (retrieve)
    path(
        '',
        TransactionViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='transactions-clean-list-create',
    ),
    path(
        '<int:pk>/',
        TransactionViewSet.as_view({'get': 'retrieve'}),
        name='transactions-clean-detail',
    ),

    # Backward-compatible router-generated paths:
    # /api/transactions/transactions/ and /api/transactions/transactions/<id>/
    path('', include(router.urls)),
]
