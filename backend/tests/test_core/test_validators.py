from apps.core.utils.validators import validate_phone, validate_amount, validate_account_number

def test_validate_phone():
    assert validate_phone('1234567890') == True
    assert validate_phone('+1234567890') == True
    assert validate_phone('123') == False

def test_validate_amount():
    assert validate_amount(100) == True
    assert validate_amount(0) == False
    assert validate_amount(-50) == False

def test_validate_account_number():
    assert validate_account_number('ACC123456') == True
    assert validate_account_number('ACC') == False
