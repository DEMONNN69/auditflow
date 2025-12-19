from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.transactions.models.transaction import Account, Transaction, Balance
from apps.transactions.serializers.transaction import AccountSerializer, TransactionSerializer, BalanceSerializer
from apps.transactions.services.transaction_service import TransactionService
from apps.core.exceptions.base import InsufficientBalanceException, InvalidTransactionException

class AccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        account = Account.objects.filter(user=self.request.user).first()
        if not account:
            return Transaction.objects.none()
        return Transaction.objects.filter(
            models.Q(from_account=account) | models.Q(to_account=account)
        )

    def create(self, request, *args, **kwargs):
        try:
            from_account = Account.objects.get(user=request.user)
            to_account_id = request.data.get('to_account')
            amount = request.data.get('amount')
            description = request.data.get('description', '')

            to_account = Account.objects.get(id=to_account_id)

            txn = TransactionService.create_transaction(
                from_account=from_account,
                to_account=to_account,
                amount=float(amount),
                transaction_type='transfer',
                description=description
            )

            serializer = self.get_serializer(txn)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Account.DoesNotExist:
            return Response({'error': 'Account not found'}, status=status.HTTP_404_NOT_FOUND)
        except InsufficientBalanceException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidTransactionException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class BalanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BalanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        account = Account.objects.filter(user=self.request.user).first()
        if not account:
            return Balance.objects.none()
        return Balance.objects.filter(account=account)
