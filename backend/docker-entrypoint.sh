#!/bin/sh
set -e

echo "Waiting for PostgreSQL database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.5
done
echo "PostgreSQL is ready!"

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Seeding demonstration data if needed..."
python manage.py seed_data || true

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Gunicorn application server..."
exec gunicorn core.wsgi:application \
    --name jobboard_backend \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --log-level=info \
    --access-logfile - \
    --error-logfile -
