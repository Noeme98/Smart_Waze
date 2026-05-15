# SmartWayz

SmartWayz is a full-stack reporting platform built with Django REST Framework and React. The repository is divided into two main applications:

- `backend/` contains the API, authentication flows, data models, and media handling.
- `frontend/` contains the web interface for citizens and authorities.

## Repository Structure

```text
smartwayz/
├── backend/
│   ├── api/
│   ├── smartwayz_backend/
│   ├── requirements.txt
│   └── docker-compose.yml
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm
- Docker and Docker Compose for the containerized backend workflow

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend is available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server is available at `http://localhost:5173` by default.

## Additional Documentation

- [backend/README.md](backend/README.md) for backend setup and operations
- [frontend/README.md](frontend/README.md) for frontend development notes
- [backend/API_TESTING.md](backend/API_TESTING.md) for API usage and testing
- [backend/AUTH_API.md](backend/AUTH_API.md) for authentication endpoints
- [TESTING_GUIDE.md](TESTING_GUIDE.md) for repository-level testing notes
