import hashlib
import uuid
from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from apps.transactions.models.transaction import Transaction
from apps.core.exceptions.base import InsufficientBalanceException, InvalidTransactionException

class TransactionService:
    @staticmethod
    def create_transaction(from_user, to_user, amount, transaction_type, description=""):
        try:
            amount = Decimal(str(amount))
        except (InvalidOperation, TypeError):
            raise InvalidTransactionException("Invalid amount")

        if amount <= 0:
            raise InvalidTransactionException("Amount must be greater than zero")
        
        if transaction_type == 'transfer' and from_user.balance < amount:
            raise InsufficientBalanceException("Insufficient balance")

        with db_transaction.atomic():
            reference_id = str(uuid.uuid4())
            
            # Create transaction
            txn = Transaction.objects.create(
                from_user=from_user if transaction_type == 'transfer' else None,
                from_recipient_id=from_user.recipient_id if transaction_type == 'transfer' else '',
                to_user=to_user,
                to_recipient_id=to_user.recipient_id,
                amount=amount,
                transaction_type=transaction_type,
                status='pending',
                description=description,
                reference_id=reference_id,
                transaction_hash=TransactionService.generate_hash(reference_id)
            )

            # Update balances
            if transaction_type == 'transfer':
                from_user.balance -= amount
                from_user.save()

            to_user.balance += amount
            to_user.save()

            # Mark transaction as completed
            txn.status = 'completed'
            txn.save()

            return txn

    @staticmethod
    def generate_hash(reference_id):
        return hashlib.sha256(reference_id.encode()).hexdigest()
