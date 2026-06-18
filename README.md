# StoryNest - Full Stack Blogging Platform

StoryNest is a modern full-stack blogging platform built with Django REST Framework and React. The platform provides secure authentication, social login, content publishing, user profiles, JWT-based authorization, and a responsive user experience.

## Live Demo

Frontend: https://storynest-murex.vercel.app

Backend API: https://storynest-api.onrender.com

## Features

### Authentication & Security

* JWT Authentication
* User Registration & Login
* Google OAuth Login
* GitHub OAuth Login
* Secure Logout
* Token Refresh
* Password Validation (Django's built-in validators: minimum length, common-password check, numeric/user-attribute similarity)
* API Rate Limiting
* Protected Routes
* Secure Production Settings (SSL redirect, secure cookies, CSRF/CORS hardening — see `blog_project/settings.py` for full configuration)

### Blog Features

* Create Posts
* Edit Posts
* Delete Posts
* View Blog Posts
* Pagination
* Search Functionality
* Tag System
* Author Profiles

### User Features

* Public User Profiles
* Profile Image Upload
* User Dashboard
* My Posts Section
* Social Authentication Integration

### DevOps & Deployment

* CI/CD with GitHub Actions
* Automated Testing
* Render Deployment
* Vercel Deployment
* PostgreSQL Database
* Environment Variable Management

## Tech Stack

### Frontend

* React
* Vite
* React Router DOM
* Axios
* Zustand
* Tailwind CSS

### Backend

* Python
* Django
* Django REST Framework
* Simple JWT
* Django Social Auth
* PostgreSQL
* WhiteNoise

### Cloud & Deployment

* Vercel
* Render
* GitHub Actions
* PostgreSQL

## Architecture Diagram

```text
┌─────────────────────────┐
│         User            │
│   Web Browser Client    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│        Frontend         │
│ React + Vite + Zustand  │
│ Hosted on Vercel        │
└────────────┬────────────┘
             │ REST API
             ▼
┌─────────────────────────┐
│         Backend         │
│ Django REST Framework   │
│ Hosted on Render        │
└───────┬─────────┬───────┘
        │         │
        │         │
        ▼         ▼
┌─────────────┐  ┌─────────────────┐
│ JWT Auth    │  │ Social OAuth    │
│ Login       │  │ Google/GitHub   │
└──────┬──────┘  └────────┬────────┘
       │                  │
       ▼                  ▼
┌─────────────────────────────────┐
│ Django Authentication System    │
│ Users • Profiles • Sessions     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────┐
│     PostgreSQL DB       │
│ Users                   │
│ Profiles                │
│ Blog Posts              │
│ Tags                    │
└─────────────────────────┘

CI/CD Pipeline

┌──────────────┐
│   GitHub     │
└──────┬───────┘
       │ Push
       ▼
┌─────────────────────┐
│ GitHub Actions CI   │
│ Install Dependencies│
│ Run Migrations      │
│ Execute Tests       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Deployment          │
│ Vercel + Render     │
└─────────────────────┘
```

> Note: the database diagram above reflects tables currently backing the live API (Users, Profiles, Blog Posts, Tags). A `Comments` table is planned but not yet implemented — see [Future Improvements](#future-improvements).

## Request Flow

1. User accesses StoryNest through the Vercel frontend.
2. React application sends API requests using Axios.
3. Django REST Framework processes requests.
4. JWT Authentication validates users.
5. PostgreSQL stores and retrieves data.
6. Responses are returned to the frontend.
7. Zustand manages client-side state.

## OAuth Authentication Flow

```text
User
  │
  ▼
Google / GitHub
  │
  ▼
Django Social Auth
  │
  ▼
OAuth Callback
  │
  ▼
JWT Token Generation
  │
  ▼
React Frontend
  │
  ▼
Authenticated Session
```

## Screenshots

> Add screenshots or a short demo GIF here (e.g. home feed, post editor, profile page) so visitors can see the UI without visiting the live demo. Drop image files into a `screenshots/` folder and reference them like:
>
> `![Home feed](screenshots/home-feed.png)`

## Project Structure

```text
storynest-django-blog/
│
├── account/
│   ├── serializers.py
│   ├── views.py
│   ├── models.py
│   ├── urls.py
│   └── pipeline.py
│
├── blog/
│   ├── serializers.py
│   ├── views.py
│   ├── models.py
│   ├── permissions.py
│   └── urls.py
│
├── blog_project/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── throttles.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── tests/
├── requirements.txt
├── manage.py
└── README.md
```

## Installation

### Clone Repository

```bash
git clone https://github.com/Aaryansrinivas/storynest-django-blog.git
cd storynest-django-blog
```

### Backend Setup

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env`

```env
SECRET_KEY=your-secret-key
DEBUG=True

DATABASE_URL=postgres://postgres:password@localhost:5432/blogdb

GOOGLE_OAUTH2_KEY=your-google-client-id
GOOGLE_OAUTH2_SECRET=your-google-client-secret

GITHUB_OAUTH2_KEY=your-github-client-id
GITHUB_OAUTH2_SECRET=your-github-client-secret

FRONTEND_URL=http://localhost:5173
```

Run migrations:

```bash
python manage.py migrate
```

Start backend:

```bash
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

Run frontend:

```bash
npm run dev
```

## API Endpoints

### Authentication

```http
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
POST /api/auth/logout/
GET  /api/auth/me/
PUT  /api/auth/profile/update/
```

### OAuth

```http
GET  /api/auth/oauth/providers/
POST /api/auth/oauth/token/

GET  /auth/social/login/google-oauth2/
GET  /auth/social/login/github/
```

### Blog APIs

```http
GET    /api/posts/
POST   /api/posts/
GET    /api/posts/<slug>/
PUT    /api/posts/<slug>/
DELETE /api/posts/<slug>/

GET    /api/tags/
```

## Running Tests

```bash
python manage.py test
```

> Add a coverage badge or summary here once you've run `coverage run manage.py test && coverage report` — this gives visitors a concrete sense of how much of the codebase is exercised by the test suite.

## CI/CD Pipeline

GitHub Actions automatically:

* Installs dependencies
* Creates PostgreSQL test database
* Runs migrations
* Executes automated tests
* Validates code before deployment

Workflow file:

```text
.github/workflows/ci.yml
```

## Security Features

* JWT Authentication
* Refresh Tokens
* OAuth Authentication
* Password Validation
* Rate Limiting
* CSRF Protection
* CORS Protection
* Secure Production Settings

## Future Improvements

* Email Verification
* Password Reset
* Rich Text Editor
* Comments System (table is modeled in the schema; API and UI not yet built)
* Bookmarks
* Notifications
* AI Content Recommendations
* Reading Analytics
* User Following System

## Author

AARYAN SRINIVAS



GitHub:
https://github.com/Aaryansrinivas

LinkedIn:
https://linkedin.com/in/aaryan-srinivas-08011b335
