import logging
from decimal import Decimal, InvalidOperation
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from apps.transactions.models.transaction import Transaction
from apps.transactions.serializers.transaction import TransactionSerializer
from apps.transactions.services.transaction_service import TransactionService
from apps.users.models.user import CustomUser
from apps.core.exceptions.base import InsufficientBalanceException, InvalidTransactionException

logger = logging.getLogger(__name__)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Transaction.objects.filter(
            models.Q(from_user=user) | models.Q(to_user=user)
        )

    def create(self, request, *args, **kwargs):
        try:
            from_user = request.user
            to_recipient_id = request.data.get('to_recipient_id')
            raw_amount = request.data.get('amount')
            description = request.data.get('description', '')

            if not to_recipient_id:
                return Response(
                    {'error': 'Recipient ID is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if raw_amount in (None, ''):
                return Response(
                    {'error': 'Amount is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                amount = Decimal(str(raw_amount))
            except (InvalidOperation, TypeError):
                return Response(
                    {'error': 'Invalid amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if amount <= 0:
                return Response(
                    {'error': 'Amount must be greater than zero'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                to_user = CustomUser.objects.get(recipient_id=to_recipient_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {'error': 'Recipient not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if to_user == from_user:
                return Response(
                    {'error': 'Cannot transfer to yourself'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            txn = TransactionService.create_transaction(
                from_user=from_user,
                to_user=to_user,
                amount=amount,
                transaction_type='transfer',
                description=description
            )

            serializer = self.get_serializer(txn)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except InsufficientBalanceException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except InvalidTransactionException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(
                "Transaction creation failed for from_user=%s to_recipient_id=%s",
                getattr(request.user, 'id', None),
                to_recipient_id,
            )
            return Response({'error': 'Transaction failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
