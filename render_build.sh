#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=========================================================="
echo "HireSphere Cloud Build Script (Render / Railway / Linux)"
echo "=========================================================="

# 1. Upgrade pip and install backend requirements
echo "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# 2. Collect static files for WhiteNoise
echo "Collecting static assets..."
python backend/manage.py collectstatic --noinput

# 3. Apply database migrations
echo "Applying database migrations..."
python backend/manage.py migrate --noinput

# 4. Optional demo data seeding
if [ "${SEED_DEMO_DATA:-False}" = "True" ] || [ "${SEED_DEMO_DATA:-False}" = "true" ] || [ "${SEED_DEMO_DATA:-False}" = "1" ]; then
    echo "SEED_DEMO_DATA is enabled. Seeding demo accounts and jobs..."
    python backend/manage.py seed_data || echo "Notice: Demo data seed skipped or already seeded."
else
    echo "SEED_DEMO_DATA is False. Skipping demo data insertion."
fi

echo "HireSphere build completed successfully!"
