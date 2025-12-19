import re

def validate_phone(phone):
    pattern = r'^\+?1?\d{9,15}$'
    return re.match(pattern, phone) is not None

def validate_amount(amount):
    return amount > 0

def validate_account_number(account):
    return len(account) >= 8
