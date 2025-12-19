class AuditFlowException(Exception):
    pass

class TransactionException(AuditFlowException):
    pass

class InsufficientBalanceException(TransactionException):
    pass

class InvalidTransactionException(TransactionException):
    pass

class AuditException(AuditFlowException):
    pass

class ImmutabilityViolationException(AuditException):
    pass
