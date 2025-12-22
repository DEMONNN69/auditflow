# AuditFlow - P2P Transaction System

AuditFlow is a mission-critical peer-to-peer transaction system built with Django REST Framework and React, ensuring high data integrity and comprehensive audit logging.

## Features

- **JWT Authentication**: Secure token-based authentication with SimpleJWT
- **Atomic Transactions**: All-or-nothing transaction processing
- **Immutable Audit Logs**: Comprehensive audit trail for compliance
- **RESTful API**: Well-documented API with Swagger documentation
- **Real-time Balance Updates**: Instant balance tracking across accounts
- **Role-Based Access Control**: Admin and user permission levels

## Tech Stack

### Backend
- Django + Django REST Framework
- SQLite (db.sqlite3) for local development
- SimpleJWT for authentication
- Docker containerization

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling

## Project Structure

```
auditflow/
├── backend/
│   ├── apps/
│   │   ├── audit/
│   │   ├── core/
│   │   ├── transactions/
│   │   └── users/
│   ├── config/
│   │   └── settings/ (base.py, development.py, production.py)
│   ├── db.sqlite3
│   ├── manage.py
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── lib/
│   │   ├── routes/
│   │   └── schemas/
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx.conf
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows (PowerShell)
./venv/Scripts/Activate.ps1
# Windows (cmd)
venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Environment Variables
Create a `.env` file in `backend/` (loaded by settings) with at least:

```env
SECRET_KEY=change-me
DEBUG=true
ALLOWED_HOSTS=*

# CORS (frontend origin)
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Optional but recommended:
- Create an admin user:

```bash
python manage.py createsuperuser --email admin@example.com
```

Notes:
- JWT defaults: access 5 minutes, refresh 1 day (see Swagger docs below).
- Custom user model uses email as login; `recipient_id` is auto-generated.

### Frontend Setup

```bash
cd frontend
npm install or pnpm install
npm run dev
```

Configure API base URL (if backend not on default):

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

### Docker Deployment

```bash
docker-compose up -d
```

Note: Local development uses SQLite by default (`DJANGO_SETTINGS_MODULE` is `config.settings.development` in `manage.py`). The compose file includes Postgres and Redis services; you can keep them running, but the backend will still use SQLite unless you switch settings.

## API Documentation

Access Swagger documentation at `http://localhost:8000/api/docs/`

## API Endpoints

Base URL: `http://localhost:8000`

### Health & Docs
- GET `/api/health/` — health check (also available without trailing slash)
- GET `/api/docs/` — Swagger UI
- GET `/api/schema/` — OpenAPI JSON

### Auth & Users
- POST `/api/users/token/` — obtain JWT (`email`, `password`) → `{ access, refresh }`
- POST `/api/users/token/refresh/` — refresh access (`refresh`) → `{ access }`
- POST `/api/users/users/` — register user (AllowAny)
- GET `/api/users/users/me/` — current user profile
- GET `/api/users/users/recipient/{recipient_id}/` — lookup recipient by ID (AllowAny)
- POST `/api/users/users/change_password/` — change password (`old_password`, `new_password`)

### Transactions
- GET `/api/transactions/` — list your transactions (sent and received)
- POST `/api/transactions/` — create transfer
	- Body: `{ "to_recipient_id": "1234567890", "amount": "100.00", "description": "optional" }`
	- Notes: amount must be greater than zero; cannot transfer to self; 400 on insufficient balance.
- GET `/api/transactions/:id/` — get transaction by ID

### Audit Logs
- GET `/api/audit/logs/` — list audit logs
	- Non-staff: only own logs
	- Staff: all logs; supports `?event_type=` and `?user_id=` filters
- GET `/api/audit/logs/my_logs/` — current user’s audit logs

## Testing

```bash
# Backend tests
#Navigate to the backend folder

pytest tests/ -v

```

## Database Schema

AuditFlow uses SQLite (development) with the following schema:

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS DOMAIN                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────┐            │
│  │ auth_user (CustomUser)                               │            │
│  ├──────────────────────────────────────────────────────┤            │
│  │ PK: id (INTEGER)                                     │            │
│  │ ├─ username (VARCHAR)                                │            │
│  │ ├─ email (VARCHAR, UNIQUE)                           │            │
│  │ ├─ first_name (VARCHAR)                              │            │
│  │ ├─ last_name (VARCHAR)                               │            │
│  │ ├─ password (VARCHAR)                                │            │
│  │ ├─ is_staff (BOOLEAN, default: false)                │            │
│  │ ├─ is_superuser (BOOLEAN, default: false)            │            │
│  │ ├─ is_verified (BOOLEAN, default: false)             │            │
│  │ ├─ phone (VARCHAR, blank)                            │            │
│  │ ├─ recipient_id (VARCHAR[10], UNIQUE, indexed)       │            │
│  │ ├─ balance (DECIMAL[15,2], min: 0, default: 500.00)  │            │
│  │ ├─ created_at (DATETIME)                             │            │
│  │ ├─ updated_at (DATETIME)                             │            │
│  │ ├─ last_login (DATETIME, nullable)                   │            │
│  │ ├─ is_active (BOOLEAN, default: true)                │            │
│  └──────────────────────────────────────────────────────┘            │
│         ▲                                            ▲                │
│         │ 1:1                                        │ 1:Many        │
│         │                                            │                │
│  ┌──────┴──────────────────────┐      ┌──────────────┴────────────┐ │
│  │ users_userprofile            │      │ (sent_transactions)        │ │
│  ├──────────────────────────────┤      │ (received_transactions)    │ │
│  │ PK: id (INTEGER)             │      │ (audit_logs)               │ │
│  │ ├─ user_id (FK to auth_user) │      └────────────────────────────┘ │
│  │ ├─ bio (TEXT)                │                                      │
│  │ ├─ avatar (VARCHAR)          │                                      │
│  │ ├─ address (VARCHAR)         │                                      │
│  │ ├─ city (VARCHAR)            │                                      │
│  │ ├─ country (VARCHAR)         │                                      │
│  │ ├─ created_at (DATETIME)     │                                      │
│  │ ├─ updated_at (DATETIME)     │                                      │
│  └──────────────────────────────┘                                      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                     TRANSACTIONS DOMAIN                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐          │
│  │ transactions_transaction                                   │          │
│  ├────────────────────────────────────────────────────────────┤          │
│  │ PK: id (INTEGER)                                           │          │
│  │ ├─ from_user_id (FK to auth_user, nullable)               │          │
│  │ ├─ from_recipient_id (VARCHAR[10], blank)                 │          │
│  │ ├─ to_user_id (FK to auth_user, REQUIRED)                 │          │
│  │ ├─ to_recipient_id (VARCHAR[10], default: "0000000000")   │          │
│  │ ├─ amount (DECIMAL[15,2], min: 0.01)                      │          │
│  │ ├─ transaction_type (VARCHAR[20])                          │          │
│  │ │   ├─ "transfer" (peer-to-peer)                           │          │
│  │ │   ├─ "deposit" (account funding)                         │          │
│  │ │   └─ "withdrawal" (cash out)                             │          │
│  │ ├─ status (VARCHAR[20], default: "pending")               │          │
│  │ │   ├─ "pending"   (awaiting processing)                   │          │
│  │ │   ├─ "completed" (success)                               │          │
│  │ │   └─ "failed"    (error occurred)                        │          │
│  │ ├─ description (TEXT, blank)                              │          │
│  │ ├─ transaction_hash (VARCHAR[64], UNIQUE)                 │          │
│  │ ├─ reference_id (VARCHAR[50], UNIQUE)                     │          │
│  │ ├─ created_at (DATETIME)                                  │          │
│  │ ├─ updated_at (DATETIME)                                  │          │
│  │ ├─ is_deleted (BOOLEAN, default: false)                   │          │
│  │ └─ deleted_at (DATETIME, nullable)                        │          │
│  └────────────────────────────────────────────────────────────┘          │
│         ▲                                        ▲                       │
│         │ 1:Many                                 │ 1:Many                │
│         └─────────────────────────┬──────────────┘                       │
│                                   │                                      │
│                          (audit_logs foreign key)                        │
│                                   │                                      │
└───────────────────────────────────┼──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        AUDIT DOMAIN                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐          │
│  │ audit_auditlog (READ-ONLY / IMMUTABLE)                     │          │
│  ├────────────────────────────────────────────────────────────┤          │
│  │ PK: id (INTEGER)                                           │          │
│  │ ├─ event_type (VARCHAR[50], indexed)                       │          │
│  │ │   ├─ "transaction_created"                               │          │
│  │ │   ├─ "transaction_completed"                             │          │
│  │ │   ├─ "transaction_failed"                                │          │
│  │ │   ├─ "balance_updated"                                   │          │
│  │ │   ├─ "user_login"                                        │          │
│  │ │   ├─ "user_logout"                                       │          │
│  │ │   └─ "account_created"                                   │          │
│  │ ├─ user_id (FK to auth_user, nullable, indexed)            │          │
│  │ ├─ transaction_id (FK to transactions_transaction, null)    │          │
│  │ ├─ description (TEXT)                                      │          │
│  │ ├─ data (JSON)                                             │          │
│  │ ├─ ip_address (VARCHAR)                                    │          │
│  │ ├─ user_agent (TEXT)                                       │          │
│  │ ├─ is_immutable (BOOLEAN, default: true, not editable)    │          │
│  │ ├─ created_at (DATETIME, indexed)                          │          │
│  │ └─ updated_at (DATETIME)                                   │          │
│  └────────────────────────────────────────────────────────────┘          │
│                                                                           │
│  ⚠️  IMMUTABILITY: Cannot UPDATE or DELETE after creation.              │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### Table Details

#### auth_user (CustomUser)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| email | VARCHAR(254) | UNIQUE, NOT NULL | Login identifier |
| username | VARCHAR(150) | NOT NULL | Mirrors email |
| first_name | VARCHAR(150) | | |
| last_name | VARCHAR(150) | | |
| password | VARCHAR(128) | NOT NULL | Hashed (PBKDF2) |
| is_staff | BOOLEAN | DEFAULT: false | Admin flag |
| is_superuser | BOOLEAN | DEFAULT: false | Superuser flag |
| is_active | BOOLEAN | DEFAULT: true | Deactivation flag |
| is_verified | BOOLEAN | DEFAULT: false | Email verification |
| phone | VARCHAR(20) | BLANK: true | |
| recipient_id | VARCHAR(10) | UNIQUE, NOT NULL, INDEXED | 10-digit sender ID |
| balance | DECIMAL(15,2) | DEFAULT: 500.00, MIN: 0.00 | Account balance in currency |
| created_at | DATETIME | AUTO_NOW_ADD | Account creation timestamp |
| updated_at | DATETIME | AUTO_NOW | Last modification timestamp |
| last_login | DATETIME | NULLABLE | Django built-in |

#### users_userprofile
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| user_id | INTEGER | UNIQUE, FK → auth_user | 1:1 relationship |
| bio | TEXT | BLANK: true | User biography |
| avatar | VARCHAR(255) | BLANK: true, NULL: true | Image file path |
| address | VARCHAR(255) | BLANK: true | Street address |
| city | VARCHAR(100) | BLANK: true | |
| country | VARCHAR(100) | BLANK: true | |
| created_at | DATETIME | AUTO_NOW_ADD | Profile creation |
| updated_at | DATETIME | AUTO_NOW | Last profile update |

#### transactions_transaction
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| from_user_id | INTEGER | FK → auth_user, NULL: true | Sender user (nullable for deposits) |
| from_recipient_id | VARCHAR(10) | BLANK: true, DEFAULT: '' | Sender's recipient_id (copy) |
| to_user_id | INTEGER | FK → auth_user, NOT NULL | Receiver user (required) |
| to_recipient_id | VARCHAR(10) | DEFAULT: '0000000000' | Receiver's recipient_id (copy) |
| amount | DECIMAL(15,2) | MIN: 0.01 | Transaction amount |
| transaction_type | VARCHAR(20) | CHOICES: transfer, deposit, withdrawal | Type of transaction |
| status | VARCHAR(20) | CHOICES: pending, completed, failed, DEFAULT: pending | Atomic status |
| description | TEXT | BLANK: true | User note |
| transaction_hash | VARCHAR(64) | UNIQUE, NOT NULL | Immutable transaction hash |
| reference_id | VARCHAR(50) | UNIQUE, NOT NULL | Public reference code |
| created_at | DATETIME | AUTO_NOW_ADD | Transaction creation |
| updated_at | DATETIME | AUTO_NOW | Last status update |
| is_deleted | BOOLEAN | DEFAULT: false | Soft delete flag |
| deleted_at | DATETIME | NULL: true | Soft delete timestamp |

#### audit_auditlog (IMMUTABLE)
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PRIMARY KEY | Auto-increment |
| event_type | VARCHAR(50) | NOT NULL, INDEXED | Type of audit event |
| user_id | INTEGER | FK → auth_user, NULL: true, INDEXED | User involved (nullable) |
| transaction_id | INTEGER | FK → transactions_transaction, NULL: true | Related transaction (optional) |
| description | TEXT | NOT NULL | Event description |
| data | JSON | DEFAULT: {} | Event metadata (dynamic) |
| ip_address | VARCHAR(45) | NULL: true | Source IP address |
| user_agent | TEXT | BLANK: true | HTTP user agent |
| is_immutable | BOOLEAN | DEFAULT: true, NOT EDITABLE | Immutability flag |
| created_at | DATETIME | AUTO_NOW_ADD, INDEXED | Audit timestamp (with created_at, event_type) |
| updated_at | DATETIME | AUTO_NOW | Always matches created_at |

### Key Design Decisions

1. **Recipient ID**: 10-digit unique identifier for each user (instead of relying on user ID alone). Enables public-facing references without exposing internal DB IDs.

2. **Balance Tracking**: Stored on `auth_user.balance` and updated atomically with transactions. Validators ensure non-negative balance.

3. **Immutable Audit Logs**: `is_immutable=true` prevents updates/deletes. Compliance requirement for audit trail integrity.

4. **Soft Deletes**: `transactions_transaction` uses `is_deleted` and `deleted_at` instead of hard deletes, preserving historical data.

5. **Atomic Transaction Processing**: `status` field ensures all-or-nothing semantics:
   - Create transaction → update balances → mark `completed`
   - If any step fails → mark `failed` (balances rolled back by DB transaction)

6. **Recipient ID Duplication**: Both `from_recipient_id` and `to_recipient_id` are stored in transactions for historical accuracy (prevents issues if recipient's ID is corrupted or deleted).

7. **Indexes**: Optimized queries on frequently searched fields:
   - `recipient_id` on auth_user (recipient lookup)
   - `(event_type, -created_at)` on audit_auditlog (event type filtering)
   - `(user_id, -created_at)` on audit_auditlog (user audit trail)
