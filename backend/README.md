# SmartWayz Backend

Django REST API for the SmartWayz reporting platform.

## Prerequisites

- Docker and Docker Compose
- `.env` file with required environment variables (see `.env.example`)

## Getting Started

### 1. Build the Docker Image

```bash
docker compose build
```

### 2. Run Database Migrations

This creates the required database tables:

```bash
docker compose run --rm django-web python manage.py migrate
```

The migration also seeds the database with:
- 2 Categories (Hazard, Infrastructure)
- 19 SubCategories (mapped to their respective categories)

### 3. Start the Application

```bash
docker compose up
```

Or run in detached mode:

```bash
docker compose up -d
```

The API will be available at `http://localhost:8000`

### 4. View Logs

```bash
docker compose logs -f django-web
```

## Development Commands

### Create Migrations

```bash
docker compose run --rm django-web python manage.py makemigrations
```

### Access Django Shell

```bash
docker compose run --rm django-web python manage.py shell
```

### Create Superuser

```bash
docker compose run --rm django-web python manage.py createsuperuser
```

### Stop the Application

```bash
docker compose down
```

## Database Access

If a PostgreSQL service is available in the active compose configuration, access it with:

```bash
docker compose exec db psql -U postgres -d smartwayzdb
```

## Verify Seeded Data

Verify that categories and subcategories were seeded correctly:

```bash
docker compose run --rm django-web python manage.py shell -c "from api.models import Category, SubCategory; print(f'Categories: {Category.objects.count()}'); print(f'SubCategories: {SubCategory.objects.count()}')"
```

Expected values:
- Categories: 2
- SubCategories: 19

## API Documentation

- **API Endpoints:** [API_TESTING.md](./API_TESTING.md) - Complete API documentation
- **Authentication:** [AUTH_API.md](./AUTH_API.md) - Login, JWT tokens, and authentication guide

### Quick API Test

Confirm that the API is reachable:

```bash
curl http://localhost:8000/api/
```

Expected response:
```json
{
    "citizens": "http://localhost:8000/api/citizens/",
    "authorities": "http://localhost:8000/api/authorities/",
    "categories": "http://localhost:8000/api/categories/",
    "subcategories": "http://localhost:8000/api/subcategories/",
    "reports": "http://localhost:8000/api/reports/"
}
```

### Browsable API

Visit `http://localhost:8000/api/` to access the Django REST Framework browsable API.

## Supabase Media Storage

To store report images in Supabase Storage instead of local `backend/media`, set the following environment variables:

```env
USE_SUPABASE_STORAGE=True
SUPABASE_ACCESS_KEY_ID=...
SUPABASE_SECRET_ACCESS_KEY=...
SUPABASE_BUCKET_NAME=...
SUPABASE_S3_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
SUPABASE_REGION=us-east-1
SUPABASE_PUBLIC_MEDIA_URL=https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>
```

Rebuild the service and run migrations:

```bash
docker compose build django-web
docker compose run --rm django-web python manage.py migrate
docker compose up -d
```

To migrate existing local files from `backend/media` to Supabase Storage:

```bash
docker compose run --rm django-web python manage.py migrate_media_to_storage
```

## Security

### Password Security

Passwords are automatically hashed using Django's PBKDF2-SHA256 algorithm with 1,000,000 iterations. Passwords are never stored in plain text.

### Password Confirmation

User registration requires password confirmation to prevent typos:
- `password` and `confirm_password` fields required
- Validation ensures both passwords match
- Clear error message if passwords don't match

For additional security documentation, see [SECURITY.md](./SECURITY.md).

This application is configured primarily for development. Review authentication, authorization, HTTPS, secret management, and deployment hardening before production use.
