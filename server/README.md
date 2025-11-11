# NewsApp1 - Server

Minimal Express + MongoDB backend for the NewsApp client.

Features implemented in this scaffold:

- JWT authentication (login)
- Roles: owner and reporter
- Owner can create/delete reporters
- Reporters and owner can create/edit/delete their own news
- News includes category, views counter (increments on GET /api/news/:id)

Quick start (PowerShell):

```powershell
cd server;
npm install;
# create .env with MONGO_URI and JWT_SECRET (see .env.example)
npm run dev
```

API highlights:

- POST /api/auth/login { email, password } -> { token }
- GET /api/news (optional ?category=Politics)
- GET /api/news/:id -> increments views
- POST /api/news (auth) -> create news
- PUT/DELETE /api/news/:id (auth + owner/author)
- GET/POST/DELETE /api/reporters (owner only)
