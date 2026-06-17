#!/usr/bin/env bash
# Quick local development setup script
set -e

echo "=== StoryNest Blog — Local Setup ==="

# Backend
echo ""
echo ">> Setting up Python backend..."
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

if [ ! -f .env ]; then
  cp .env.example .env
  echo ">> Created .env from .env.example — please edit DATABASE_URL before continuing."
  echo "   Set: DATABASE_URL=postgres://user:password@localhost:5432/dbname"
  exit 0
fi

python manage.py migrate
echo ">> Migrations applied."

# Frontend
echo ""
echo ">> Setting up Node frontend..."
cd frontend
npm install --silent
cd ..

echo ""
echo "=== Setup complete ==="
echo ""
echo "Start backend:   source venv/bin/activate && python manage.py runserver"
echo "Start frontend:  cd frontend && npm run dev"
echo ""
echo "Or use Docker:   docker compose up --build"
