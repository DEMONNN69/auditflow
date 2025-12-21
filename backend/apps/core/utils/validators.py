import re

# NOTE: These validators are reserved for future use
# Current implementation handles validation inline in views/services

# def validate_phone(phone):
#     pattern = r'^\+?1?\d{9,15}$'
#     return re.match(pattern, phone) is not None

# def validate_amount(amount):
#     return amount > 0

# def validate_account_number(account):
#     return len(account) >= 8
