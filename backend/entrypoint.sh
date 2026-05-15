#!/bin/bash
set -e

echo "Starting Django application..."

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "Database connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"

# Managed databases (e.g., Supabase) should not run local bootstrap SQL.
IS_MANAGED_DB=false
if [[ "$DB_HOST" == *"supabase.com"* ]]; then
  IS_MANAGED_DB=true
fi

# Wait for database server to be ready
echo "Waiting for database server..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "Database server is ready!"

# Check if database exists, create if not (local/self-managed only)
if [ "$IS_MANAGED_DB" = true ]; then
    echo "Managed DB detected ($DB_HOST). Skipping database/schema bootstrap."
else
    echo "Checking if database '$DB_NAME' exists..."
    export PGPASSWORD=$DB_PASSWORD
    DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

    if [ "$DB_EXISTS" != "1" ]; then
        echo "Creating database '$DB_NAME'..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" || echo "Database might already exist"
    else
        echo "Database '$DB_NAME' already exists."
    fi

    # Check if 'data' schema exists, create if not
    echo "Checking if schema 'data' exists..."
    SCHEMA_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT 1 FROM information_schema.schemata WHERE schema_name='data'" 2>/dev/null || echo "0")

    if [ "$SCHEMA_EXISTS" != "1" ]; then
        echo "Creating schema 'data'..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE SCHEMA IF NOT EXISTS data;" || echo "Schema might already exist"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON SCHEMA data TO \"$DB_USER\";"
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA data GRANT ALL PRIVILEGES ON TABLES TO \"$DB_USER\";"
    else
        echo "Schema 'data' already exists."
    fi
fi

unset PGPASSWORD

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Seed Status table
echo "Seeding Status table..."
python manage.py seed_status

# Load initial data if needed
if [ -f "load_data.py" ]; then
    echo "Loading initial data..."
    python load_data.py
fi

echo "Starting server..."
exec "$@"
