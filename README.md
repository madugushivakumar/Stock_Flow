# StockFlow – Multi-Tenant SaaS Inventory Management Platform

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-v6-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14%2B-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 1. Project Overview & Business Problem

Small-to-medium retail and wholesale businesses struggle with complicated enterprise resource planning (ERP) suites that are costly, slow to learn, and bloated with unnecessary features. Many merchants still rely on manual spreadsheets or error-prone single-user databases, leading to stockouts, lost sales, inventory discrepancies, and severe cross-tenant privacy risks when attempting multi-location tracking.

**StockFlow** is a modern, clean, robust Multi-Tenant SaaS Inventory Management System designed to solve these pain points. Built with rigorous architectural tenant isolation, StockFlow allows small business sellers and merchants to:

- Create dedicated organization accounts with zero data leakage.
- Maintain a real-time catalog of products with SKUs, descriptions, and tiered pricing.
- Track on-hand quantities with atomic stock adjustments.
- Automatically identify low-stock items based on customizable organization-wide defaults or item-level threshold overrides.
- Monitor critical inventory health indicators via an executive dashboard.

---

## 2. Core Features

### Multi-Tenant Architecture & Security
- **Strict Tenant Scoping:** Every user belongs to an Organization. Product queries, aggregations, updates, and deletes are scoped strictly by the authenticated tenant's `organizationId`.
- **JWT & bcrypt Authentication:** Secure session management with encrypted password hashes.
- **Cross-Tenant SKU Isolation:** SKU uniqueness is enforced *per organization* via compound database constraints (`organizationId, sku`), allowing different businesses to independently use identical SKU codes without collisions.

### Catalog & Product Management
- **Full CRUD:** Create, read, update, and delete products.
- **Stock Tracking:** Real-time quantity on hand tracking with instant inventory status flags (`In Stock` vs `Low Stock`).
- **Stock Adjustment:** Quick inline stock adjustment (+N or -N) with negative inventory protection and optional audit notes.
- **Instant Search & Filtering:** Filter catalog items by product name, SKU, or low-stock status.

### Low-Stock Intelligence & Calculations
- **PRD-Exact Low Stock Rule:** A product is flagged as **Low Stock** when:
  $$\text{Quantity on Hand} \le \text{Effective Threshold}$$
- **Effective Threshold Hierarchy:** If a product defines an individual `lowStockThreshold`, that value takes precedence; otherwise, it dynamically falls back to the organization's `defaultLowStockThreshold`.
- **Inclusive Equality:** When Quantity equals the threshold, it is strictly flagged as low stock to prevent stockout surprises.

### Real-time Executive Dashboard
- **Total Products:** Live count of organization-owned catalog items.
- **Total Quantity on Hand:** Real-time sum of all units currently in storage.
- **Low Stock Counter & Table:** Immediate view of all products requiring reordering, complete with effective threshold metrics.

### Tenant Settings
- **Configurable Default Threshold:** Update the organization default low-stock threshold with immediate recalculation across all dependent inventory items.

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS with responsive typography and card components
- **Routing:** React Router DOM (v6) with Protected Route wrappers
- **HTTP Client:** Axios with request/response interceptors for JWT injection
- **Forms & Validation:** React Hook Form with Zod schema validation
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (v18+ / v20+ / v24)
- **Framework:** Express.js REST API
- **ORM:** Prisma ORM v6
- **Database:** PostgreSQL
- **Security:** Helmet, CORS, bcryptjs, jsonwebtoken, express-rate-limit
- **Validation:** Zod for API payload and query validation

---

## 4. Application Architecture

```
StockFlow/
│
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static assets & SPA routing (_redirects)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Alert, Modal, LoadingSpinner
│   │   │   └── layout/         # AppLayout, Sidebar, Header
│   │   ├── context/            # AuthContext (JWT & Org state)
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage, SignupPage
│   │   │   ├── dashboard/      # DashboardPage
│   │   │   ├── products/       # ProductsPage, ProductFormModal, StockAdjustModal
│   │   │   └── settings/       # SettingsPage
│   │   ├── services/           # Axios API services
│   │   ├── routes/             # ProtectedRoute
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # React root mount
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html
│   ├── vite.config.js          # Dev proxy & build configuration
│   └── package.json
│
├── server/                     # Express.js REST API Backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema & indexes
│   │   └── migrations/         # Applied SQL migrations
│   ├── src/
│   │   ├── config/             # Prisma client singleton
│   │   ├── controllers/        # Auth, Product, Dashboard, Settings
│   │   ├── middleware/         # Auth JWT, validation, error handler
│   │   ├── routes/             # REST route endpoints
│   │   ├── validators/         # Zod schemas for input validation
│   │   ├── utils/              # Standard JSON response helpers
│   │   ├── app.js              # Express app configuration
│   │   └── server.js           # Server listen & graceful shutdown
│   ├── test-api.js             # Automated 19-suite test verification
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json                # Root workspace orchestration
```

---

## 5. Database Schema (PostgreSQL via Prisma)

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : "has"
    ORGANIZATION ||--o{ PRODUCT : "owns"

    ORGANIZATION {
        string id PK
        string name
        int defaultLowStockThreshold
        datetime createdAt
        datetime updatedAt
    }

    USER {
        string id PK
        string organizationId FK
        string email UK
        string passwordHash
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK
        string organizationId FK
        string name
        string sku
        string description
        int quantityOnHand
        decimal costPrice
        decimal sellingPrice
        int lowStockThreshold
        string lastUpdatedBy
        datetime createdAt
        datetime updatedAt
    }
```

### Constraints & Indexes
- `User.email`: Unique index.
- `Product (organizationId, sku)`: Compound unique index (`@@unique([organizationId, sku])`), enabling duplicate SKUs across different organizations while guaranteeing strict uniqueness within a single tenant.
- `Product (organizationId, name)`: Search index for high-performance catalog lookup.
- Cascade deletion: Deleting an organization cleanly removes its associated users and products.

---

## 6. Installation & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or later, v24 supported)
- [PostgreSQL](https://www.postgresql.org/) (v14 or later)
- [Git](https://git-scm.com/)

### Step 1: Clone Repository
```bash
git clone https://github.com/<your-username>/StockFlow.git
cd StockFlow
```

### Step 2: Install Dependencies
Install all workspace dependencies from root:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### Step 3: Configure Environment Variables
Create `.env` in the `server/` directory:
```bash
cp server/.env.example server/.env
```
Populate `server/.env` with your PostgreSQL database credentials and JWT secret:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/stockflow?schema=public
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d
```

### Step 4: Run Prisma Database Migrations
```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:deploy
```
*(Or use `npm --prefix server run prisma:migrate` in development)*

### Step 5: Start the Development Server
Run both frontend and backend concurrently from the root directory:
```bash
npm run dev
```
Or run separately:
- **Backend API:** `npm run dev:server` (Available at `http://localhost:5000`)
- **Frontend App:** `npm run dev:client` (Available at `http://localhost:5173`)

---

## 7. API Endpoints Reference

### Authentication
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register organization & owner account atomically | No |
| `POST` | `/api/auth/login` | Authenticate with email & password, return JWT | No |
| `GET` | `/api/auth/me` | Fetch active user and organization session | Yes |

### Products & Inventory
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/products` | List organization products (supports `?search=` and `?lowStockOnly=`) | Yes |
| `GET` | `/api/products/:id` | Get single product (scoped to tenant) | Yes |
| `POST` | `/api/products` | Create product (enforces unique SKU per organization) | Yes |
| `PUT` | `/api/products/:id` | Update product details | Yes |
| `DELETE` | `/api/products/:id` | Hard delete product | Yes |
| `PATCH` | `/api/products/:id/adjust-stock` | Increment/decrement quantity with non-negative check | Yes |

### Dashboard
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Retrieve total products, total stock, low stock count & items | Yes |

### Settings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/settings` | Retrieve tenant configuration & default threshold | Yes |
| `PUT` | `/api/settings` | Update default low stock threshold | Yes |

### Health Check
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service uptime and operational status | No |

---

## 8. Automated Testing & Verification

An automated end-to-end integration test suite is included in `server/test-api.js`. It executes 19 comprehensive test cases against the live PostgreSQL database:

1. API Health verification.
2. Atomic organization & owner signup.
3. Rejection of duplicate emails across registrations.
4. Login credential verification and JWT generation.
5. Session `/api/auth/me` context retrieval.
6. Creation of normal-stock products.
7. Low-stock detection when $\text{Quantity} < \text{Threshold}$.
8. Low-stock equality detection when $\text{Quantity} = \text{Default Threshold}$.
9. Duplicate SKU rejection within the *same* organization.
10. Registration of a secondary isolated organization (Organization B).
11. Verification that identical SKU code is *permitted* across different organizations.
12. Strict catalog isolation: Organization B cannot list Organization A's products.
13. Cross-tenant mutation protection: Organization B receives `404 Not Found` when attempting to read, update, or delete Organization A's product IDs.
14. Direct stock adjustment (+N and -N).
15. Protection against invalid negative inventory adjustments.
16. Real-time Dashboard metrics and low-stock item aggregation.
17. Updating organization default low-stock threshold.
18. Dynamic dashboard recalculation after threshold changes.
19. Product deletion and post-deletion metrics recalculation.

### Running the Test Suite:
```bash
node server/test-api.js
```

---

## 9. Deployment Guide

### Option A: Cloud Deployment (Render / Railway / Neon)

#### 1. Database (Neon / Supabase / Railway)
1. Create a cloud PostgreSQL database instance.
2. Copy the connection string (`postgresql://user:pass@host/db?sslmode=require`).

#### 2. Backend (Render / Railway)
1. Connect your GitHub repository.
2. Set Root Directory to `server`.
3. Set Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`.
4. Set Start Command: `node src/server.js`.
5. Add Environment Variables:
   - `DATABASE_URL`: Your cloud PostgreSQL URL.
   - `JWT_SECRET`: A secure 32+ character key.
   - `CLIENT_URL`: The deployed frontend URL.
   - `NODE_ENV`: `production`.

#### 3. Frontend (Vercel / Netlify)
1. Connect your GitHub repository.
2. Set Root Directory to `client`.
3. Set Build Command: `npm run build`.
4. Set Output Directory: `dist`.
5. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://stockflow-api.onrender.com/api`).
6. SPA Routing is preconfigured via `client/public/_redirects` and `client/vercel.json`.

---

## 10. Links & Submission Details

- **GitHub Repository:** [https://github.com/madugushivakumar/StockFlow](https://github.com/madugushivakumar/StockFlow)
- **Live Application:** [https://stockflow-app.vercel.app](https://stockflow-app.vercel.app) *(or your deployed URL)*
- **Demo Credentials:**
  - Email: `owner@alphatech.com`
  - Password: `password123`

---

## 11. License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
