import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from apps.transactions.models.transaction import Transaction
from apps.transactions.services.transaction_service import TransactionService
from apps.core.exceptions.base import InsufficientBalanceException

User = get_user_model()

@pytest.mark.django_db
def test_transaction_service_create_transfer(test_user, another_user):
    """Test creating a transfer via service layer"""
    # Create transaction
    txn = TransactionService.create_transaction(
        from_user=test_user,
        to_user=another_user,
        amount=Decimal('100.00'),
        transaction_type='transfer',
        description='Test transfer'
    )
    
    assert txn.from_user == test_user
    assert txn.to_user == another_user
    assert txn.amount == Decimal('100.00')
    assert txn.status == 'completed'

@pytest.mark.django_db
def test_transaction_service_insufficient_balance(test_user, another_user):
    """Test transfer fails with insufficient balance"""
    # Set test_user balance to 50
    test_user.balance = Decimal('50.00')
    test_user.save()
    
    # Attempt transfer of 100 (should fail)
    with pytest.raises(InsufficientBalanceException):
        TransactionService.create_transaction(
            from_user=test_user,
            to_user=another_user,
            amount=Decimal('100.00'),
            transaction_type='transfer'
        )

@pytest.mark.django_db
def test_transaction_api_list(authenticated_client, test_user):
    """Test listing transactions via API"""
    response = authenticated_client.get('/api/transactions/')
    assert response.status_code == 200
    assert 'results' in response.data or isinstance(response.data, list)

@pytest.mark.django_db
def test_transaction_api_create(authenticated_client, test_user, another_user):
    """Test creating a transfer via API"""
    payload = {
        'to_recipient_id': another_user.recipient_id,
        'amount': '50.00',
        'description': 'Test transfer'
    }
    
    response = authenticated_client.post('/api/transactions/', payload)
    assert response.status_code == 201
    assert response.data['amount'] == '50.00'
    assert response.data['status'] == 'completed'

@pytest.mark.django_db
def test_transaction_api_create_invalid_amount(authenticated_client):
    """Test transfer with invalid amount"""
    payload = {'to_recipient_id': '1234567890', 'amount': '-10.00'}
    response = authenticated_client.post('/api/transactions/', payload)
    assert response.status_code == 400

@pytest.mark.django_db
def test_transaction_api_retrieve(authenticated_client, test_user, another_user):
    """Test retrieving a single transaction"""
    txn = TransactionService.create_transaction(
        from_user=test_user,
        to_user=another_user,
        amount=Decimal('25.00'),
        transaction_type='transfer'
    )
    
    response = authenticated_client.get(f'/api/transactions/{txn.id}/')
    assert response.status_code == 200
    assert response.data['id'] == txn.id
