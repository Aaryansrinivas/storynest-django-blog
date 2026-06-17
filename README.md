# StoryNest — Django + React Blog

Full-stack blog platform built with Django REST Framework + React + Tailwind CSS.

## Stack

- **Backend**: Django 5, DRF, PostgreSQL (psycopg2), social-auth-app-django (OAuth2)
- **Frontend**: React 18, Vite, Tailwind CSS, Zustand, React Router v6
- **Auth**: JWT (SimpleJWT) + OAuth2 (Google, GitHub)
- **Database**: PostgreSQL 16 — SQLite is explicitly disabled

---

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — set SECRET_KEY, add OAuth2 credentials (optional)
docker compose up --build
```

Frontend → http://localhost:5173  
Django API → http://localhost:8000  
Django Admin → http://localhost:8000/admin

---

## Local Development

### Prerequisites
- Python 3.11+
- Node 20+
- PostgreSQL 14+

### Backend

```bash
# Create virtualenv
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your local Postgres

# Run migrations
python manage.py migrate
python manage.py createsuperuser   # optional

# Start dev server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## OAuth2 Setup

### Google

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** (Web Application)
3. Add Authorized Redirect URI: `http://localhost:8000/auth/social/complete/google-oauth2/`
4. Set in `.env`:
   ```
   GOOGLE_OAUTH2_KEY=your-client-id
   GOOGLE_OAUTH2_SECRET=your-client-secret
   ```

### GitHub

1. Go to https://github.com/settings/developers → **New OAuth App**
2. Set Homepage URL: `http://localhost:5173`
3. Set Authorization Callback URL: `http://localhost:8000/auth/social/complete/github/`
4. Set in `.env`:
   ```
   GITHUB_OAUTH2_KEY=your-client-id
   GITHUB_OAUTH2_SECRET=your-client-secret
   ```

OAuth buttons appear automatically on Login/Register pages when keys are configured. If no OAuth keys are set, the buttons are hidden.

---

## API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (get JWT) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET  | `/api/auth/me/` | Current user |
| PATCH | `/api/auth/profile/update/` | Update profile |
| GET  | `/api/auth/users/<username>/` | Public profile |
| GET  | `/api/auth/oauth/providers/` | Available OAuth providers |
| POST | `/api/auth/oauth/token/` | Exchange OAuth session for JWT |

### OAuth2 Flow
| URL | Description |
|-----|-------------|
| `GET /auth/social/login/google-oauth2/` | Start Google OAuth |
| `GET /auth/social/login/github/` | Start GitHub OAuth |
| `GET /auth/social/complete/<backend>/` | OAuth callback (handled by Django) |

### Posts
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/posts/` | List posts (paginated) |
| POST | `/api/posts/` | Create post |
| GET | `/api/posts/<slug>/` | Post detail |
| PUT/PATCH | `/api/posts/<slug>/` | Update post |
| DELETE | `/api/posts/<slug>/` | Delete post |
| POST | `/api/posts/<slug>/like/` | Toggle like |
| GET/POST | `/api/posts/<slug>/comments/` | List/create comments |
| GET | `/api/posts/my_posts/` | My posts |

### Tags
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/tags/` | List all tags |

---

## Database

PostgreSQL is **required**. SQLite will raise a `RuntimeError` at startup.

The `DATABASE_URL` env var must be set:
```
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Docker Compose automatically provides a PostgreSQL 16 container.
