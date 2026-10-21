#!/bin/sh
set -e

# Target database connection coordinates
TARGET_HOST=${DB_HOST:-db}
TARGET_PORT=${DB_PORT:-5432}

echo "=========================================================="
echo "Starting HireSphere Backend Container Initialization..."
echo "Target PostgreSQL: $TARGET_HOST:$TARGET_PORT"
echo "=========================================================="

# Bounded wait loop for PostgreSQL (max 30 attempts, 1s interval)
MAX_RETRIES=30
RETRY_COUNT=0

while ! nc -z "$TARGET_HOST" "$TARGET_PORT"; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: PostgreSQL ($TARGET_HOST:$TARGET_PORT) unreachable after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "Waiting for PostgreSQL ($TARGET_HOST:$TARGET_PORT)... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 1
done

echo "PostgreSQL is reachable and accepting TCP connections!"

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Optionally seed demonstration data if explicitly enabled
if [ "${SEED_DEMO_DATA:-False}" = "True" ] || [ "${SEED_DEMO_DATA:-False}" = "true" ] || [ "${SEED_DEMO_DATA:-False}" = "1" ]; then
  echo "SEED_DEMO_DATA is enabled. Seeding demo accounts and jobs..."
  python manage.py seed_data || echo "Notice: Demo data seed skipped or already seeded."
else
  echo "SEED_DEMO_DATA is not enabled. Skipping demo data insertion."
fi

# Collect static files for WhiteNoise and Nginx
echo "Collecting static assets..."
python manage.py collectstatic --noinput

# Start Gunicorn production WSGI server
WORKERS=${GUNICORN_WORKERS:-3}
TIMEOUT=${GUNICORN_TIMEOUT:-120}

echo "Launching Gunicorn application server ($WORKERS workers, ${TIMEOUT}s timeout)..."
exec gunicorn core.wsgi:application \
    --name jobboard_backend \
    --bind 0.0.0.0:8000 \
    --workers "$WORKERS" \
    --timeout "$TIMEOUT" \
    --log-level="${GUNICORN_LOG_LEVEL:-info}" \
    --access-logfile - \
    --error-logfile -
