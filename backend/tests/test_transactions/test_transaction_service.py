import pytest
from apps.transactions.models.transaction import Account, Transaction

@pytest.mark.django_db
def test_account_creation(test_user):
    account = Account.objects.create(
        user=test_user,
        account_number='ACC123456789',
        account_type='checking'
    )
    assert account.user == test_user
