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

