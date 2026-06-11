# Enterprise Inventory Management System

A production-style inventory platform for businesses to manage products, stock movement, suppliers, purchase orders, employees, and operational reports.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache & Queue | Redis + BullMQ |
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

### 4. Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@inventory.com | admin123 |
| Manager | manager@inventory.com | manager123 |
| Employee | employee@inventory.com | employee123 |

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

```
Routes → Controllers → Services → Prisma → PostgreSQL
                                          ↕
                                        Redis (Cache)
                                          ↕
                                     BullMQ (Queue)
                                          ↓
                                   Worker → Email Alerts
```
