# Enterprise Inventory Management System

A production-style inventory platform for businesses to manage products, stock movement, suppliers, purchase orders, employees, and operational reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache & Jobs | Redis + node-cron |
| Auth | JWT (Access + Refresh tokens) |
| Email | Nodemailer (Ethereal test SMTP) |
| Logging | Winston |
| Infra | Docker Compose |

## Quick Start

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Setup Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Access Locally
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

## Deployment

### Frontend (Vercel)
The frontend is optimized for deployment on Vercel. A `vercel.json` file is included in the `frontend` directory to properly handle SPA client-side routing. 
**Important**: Ensure you set the `VITE_API_URL` environment variable (e.g., `https://your-backend.onrender.com/api`) in your Vercel project settings.

### Backend (Render)
The backend is configured to be easily deployed on services like Render.
- **Root Directory**: `backend`
- **Build Command**: `npm install --include=dev && npm run build` (Ensures `@types` are installed so `tsc` can compile successfully).
- **Start Command**: `npm start`
Make sure to add all corresponding environment variables (Database, Redis, JWT Secrets) in your hosting dashboard.

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /api/auth/register, login, refresh-token, logout |
| Products | GET/POST/PUT/DELETE /api/products |
| Categories | GET/POST/PUT/DELETE /api/categories |
| Inventory | POST /api/inventory/stock-in, stock-out, adjustment |
| Suppliers | GET/POST/PUT/DELETE /api/suppliers |
| Orders | GET/POST /api/orders, PATCH /api/orders/:id/status |
| Reports | GET /api/reports/dashboard, inventory, stock-movement |
| Audit | GET /api/audit-logs |
| Notifications | GET/PATCH /api/notifications |

## Architecture

```text
Routes → Controllers → Services → Prisma → PostgreSQL
                                          ↕
                                        Redis (Cache)
                                          ↕
                               node-cron (Background Jobs)
                                          ↓
                                   Email Alerts
```
