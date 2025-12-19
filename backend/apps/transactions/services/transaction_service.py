import hashlib
import uuid
from decimal import Decimal
from django.db import transaction as db_transaction
from apps.transactions.models.transaction import Account, Transaction, Balance
from apps.core.exceptions.base import InsufficientBalanceException, InvalidTransactionException

class TransactionService:
    @staticmethod
    def create_transaction(from_account, to_account, amount, transaction_type, description=""):
        if amount <= 0:
            raise InvalidTransactionException("Amount must be greater than zero")
        
        if transaction_type == 'transfer' and from_account.balance < amount:
            raise InsufficientBalanceException("Insufficient balance")

        with db_transaction.atomic():
            reference_id = str(uuid.uuid4())
            
            # Create transaction
            txn = Transaction.objects.create(
                from_account=from_account if transaction_type == 'transfer' else None,
                to_account=to_account,
                amount=amount,
                transaction_type=transaction_type,
                status='pending',
                description=description,
                reference_id=reference_id,
                transaction_hash=TransactionService.generate_hash(reference_id)
            )

            # Update balances
            if transaction_type == 'transfer':
                from_account.balance -= amount
                from_account.save()
                Balance.objects.create(
                    account=from_account,
                    current_balance=from_account.balance,
                    previous_balance=from_account.balance + amount,
                    transaction=txn
                )

            to_account.balance += amount
            to_account.save()
            Balance.objects.create(
                account=to_account,
                current_balance=to_account.balance,
                previous_balance=to_account.balance - amount,
                transaction=txn
            )

            # Mark transaction as completed
            txn.status = 'completed'
            txn.save()

            return txn

    @staticmethod
    def generate_hash(reference_id):
        return hashlib.sha256(reference_id.encode()).hexdigest()
