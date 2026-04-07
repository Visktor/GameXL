#!/usr/bin/env bash
set -e

echo "Setting up GameXL..."

# Generate a secure better-auth secret
SECRET=$(openssl rand -base64 32)

# apps/server/.env
if [ -f apps/server/.env ]; then
  echo "apps/server/.env already exists, skipping."
else
  cat > apps/server/.env <<EOF
DATABASE_URL=postgresql://postgres:password@localhost:5433/GameXL

BETTER_AUTH_SECRET=$SECRET
BETTER_AUTH_URL=http://localhost:3000

CORS_ORIGIN=http://localhost:5180
EOF
  echo "Created apps/server/.env"
fi

# apps/web/.env
if [ -f apps/web/.env ]; then
  echo "apps/web/.env already exists, skipping."
else
  cat > apps/web/.env <<EOF
VITE_SERVER_URL=http://localhost:3000
PORT=5180
EOF
  echo "Created apps/web/.env"
fi

# apps/native/.env
if [ -f apps/native/.env ]; then
  echo "apps/native/.env already exists, skipping."
else
  cat > apps/native/.env <<EOF
EXPO_PUBLIC_SERVER_URL=http://localhost:3000
EOF
  echo "Created apps/native/.env"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Start the database
echo "Starting database..."
pnpm db:start

# Wait for Postgres to be ready
echo "Waiting for database to be ready..."
until docker exec GameXL-postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

# Run migrations
echo "Running migrations..."
pnpm db:migrate

echo ""
echo "Setup complete. Start the project with: pnpm dev"
