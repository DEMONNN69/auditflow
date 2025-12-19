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
- PostgreSQL Database
- SimpleJWT for authentication
- Celery for async tasks
- Docker containerization

### Frontend
- React 18
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling

## Project Structure

```
auditflow/
├── backend/          # Django REST API
│   ├── apps/
│   │   ├── core/    # Shared utilities
│   │   ├── users/   # Authentication & user management
│   │   ├── transactions/  # Transaction logic
│   │   └── audit/   # Audit logging
│   └── config/      # Django settings
├── frontend/        # React SPA
│   └── src/
│       ├── features/    # Domain-specific features
│       ├── components/  # Reusable components
│       └── services/    # API integration
└── docker-compose.yml
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

## API Documentation

Access Swagger documentation at `http://localhost:8000/api/docs/`

## Testing

```bash
# Backend tests
pytest backend/

# Frontend tests
npm test
```

## Contributing

See `CONTRIBUTING.md` for guidelines.

## License

Proprietary - Audit Flow System
