# StockFlow — Multi-Tenant SaaS Inventory Management Platform

<p align="center">
  <strong>A secure, modern, multi-tenant inventory management platform for growing businesses.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24-brightgreen?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-14%2B-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tests-57%20Passing-success" alt="Tests" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License" />
</p>

---

## 1. Overview

StockFlow is a multi-tenant SaaS inventory management platform designed to help small and medium-sized businesses manage products, monitor stock levels, and maintain accurate inventory records through a centralized dashboard.

Traditional inventory management often relies on spreadsheets, disconnected databases, or expensive enterprise resource planning systems. These approaches can introduce stock discrepancies, operational inefficiencies, and security risks when multiple businesses share the same application.

StockFlow addresses these challenges through a secure, organization-based architecture that keeps each tenant's data isolated while providing a simple and responsive inventory management experience.

### Key objectives

- Provide independent organization accounts.
- Maintain secure tenant-level data isolation.
- Simplify product catalog management.
- Track inventory quantities and stock adjustments.
- Identify low-stock products automatically.
- Provide real-time inventory summaries.
- Support configurable organization-level inventory settings.

## 2. Features

### Multi-Tenant Architecture

- Organization-based account registration.
- Each user belongs to an organization.
- Strict organization-level data isolation.
- Tenant-scoped product queries, updates, and deletions.
- Independent SKU uniqueness for each organization.
- Atomic organization and administrator registration.

### Authentication and Security

- JWT-based authentication.
- Password hashing using bcrypt.
- Protected frontend routes.
- Authentication lifecycle and session handling.
- Request validation using Zod.
- API security headers using Helmet.
- Rate limiting for sensitive endpoints.
- Centralized error handling.
- Configurable CORS origin allowlist.

### Product Management

- Create, read, update, and delete products.
- Product name and SKU management.
- Product descriptions.
- Cost and selling price information.
- Quantity-on-hand tracking.
- Product-level low-stock thresholds.
- Search and filtering.
- Duplicate SKU prevention within an organization.

### Inventory and Stock Management

- Increment and decrement stock quantities.
- Atomic stock adjustment operations.
- Negative inventory prevention.
- Optional stock adjustment notes.
- Last-adjustment information.
- Concurrent stock update protection.

### Low-Stock Intelligence

StockFlow automatically identifies products that need replenishment.

The low-stock calculation follows:

**Quantity on Hand ≤ Effective Low-Stock Threshold**

Effective threshold priority:

1. Use the product's individual low-stock threshold when configured.
2. Otherwise, use the organization's default low-stock threshold.

Equality is inclusive. A product whose quantity exactly equals its threshold is classified as low stock.

### Executive Dashboard

The dashboard provides an overview of the organization's inventory:

- Total products.
- Total quantity on hand.
- Low-stock product count.
- Low-stock product listing.
- Inventory health indicators.

Dashboard information is scoped to the authenticated organization.

### Organization Settings

- View organization settings.
- Configure the default low-stock threshold.
- Recalculate inventory status using the updated default.
- Maintain organization-specific configuration.

---

## 3. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | Component-based UI |
| Vite 6 | Frontend build tooling |
| JavaScript | Application development |
| Tailwind CSS | Responsive styling |
| React Router DOM 7 | Client-side routing |
| Axios | HTTP requests and interceptors |
| React Hook Form | Form management |
| Zod 4 | Schema validation |
| Lucide React | Icons |

### Backend

| Technology | Purpose |
|---|---|
| Node.js 24 | JavaScript runtime |
| Express 4 | REST API framework |
| Prisma ORM 6 | Database access |
| PostgreSQL | Relational database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Zod 4 | API validation |
| Helmet | Security headers |
| CORS | Cross-origin request handling |
| express-rate-limit | API rate limiting |

### Development and Deployment

- Git and GitHub
- npm workspaces
- Vercel — frontend hosting
- Render — backend hosting
- Neon PostgreSQL — cloud database

---

## 4. System Architecture

StockFlow follows a client-server architecture.

```mermaid
flowchart TD
    A[User / Browser] --> B[React 18 + Vite Frontend]
    B --> C[Axios API Client]
    C --> D[Express REST API]
    D --> E[CORS Middleware]
    E --> F[JWT Authentication]
    F --> G[Request Validation]
    G --> H[Controllers / Services]
    H --> I[Prisma ORM]
    I --> J[(PostgreSQL Database)]

    K[Organization A] --> L[Tenant Isolation]
    M[Organization B] --> L
    N[Organization C] --> L
    L --> H
```

### Request lifecycle

1. The user interacts with the React application.
2. Axios sends requests to the backend API.
3. Express handles CORS and security middleware.
4. JWT middleware authenticates protected requests.
5. Validation middleware checks incoming data.
6. Controllers execute organization-scoped operations.
7. Prisma communicates with PostgreSQL.
8. The API returns standardized JSON responses.

### Multi-tenant isolation

Every organization has independent inventory data.

Authenticated requests use the organization identity associated with the verified user session.

Product queries, dashboard aggregations, updates, and deletions must be scoped to the authenticated organization.

---

## 5. Project Structure

```text
Stock_Flow/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── layout/
│   │   │
│   │   ├── context/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   └── settings/
│   │   │
│   │   ├── routes/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── test-api.js
│   ├── .env.example
│   └── package.json
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

*This is a logical overview; individual files and additional folders may vary as the project evolves.*

---

## 6. Database Design

StockFlow uses PostgreSQL with Prisma ORM.

### Main entities

**Organization**
- Unique organization identifier.
- Organization name.
- Default low-stock threshold.
- Creation and update timestamps.

**User**
- Unique user identifier.
- Organization relationship.
- Email address.
- Hashed password.
- Creation and update timestamps.

**Product**
- Unique product identifier.
- Organization relationship.
- Product name.
- SKU.
- Description.
- Quantity on hand.
- Cost price.
- Selling price.
- Optional product-level low-stock threshold.
- Last adjustment note.
- Last updated by.
- Creation and update timestamps.

### Entity relationship diagram

```mermaid
erDiagram
    ORGANIZATION ||--o{ USER : contains
    ORGANIZATION ||--o{ PRODUCT : owns

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
        string lastAdjustmentNote
        string lastUpdatedBy
        datetime createdAt
        datetime updatedAt
    }
```

### Database constraints

- Unique user email.
- Compound unique constraint on organization ID and SKU.
- Organization-scoped product indexes.
- Foreign-key relationships.
- Referential integrity.
- Organization-owned data cleanup through configured cascade relationships.

The Prisma schema is the source of truth for the actual database structure.

---

## 7. Getting Started

### Prerequisites

Install the following:

- Node.js 24 or another project-supported Node.js version.
- npm.
- PostgreSQL 14 or later.
- Git.

### Step 1 — Clone the repository

```bash
git clone https://github.com/madugushivakumar/Stock_Flow.git
cd Stock_Flow
```

### Step 2 — Install dependencies

Run installation from the repository root because StockFlow uses npm workspaces.

```bash
npm ci
```

### Step 3 — Configure environment variables

Create your backend environment file:

**PowerShell:**

```powershell
Copy-Item server/.env.example server/.env
```

Configure the variables according to your environment:

```env
PORT=8000
NODE_ENV=development

DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/stockflow?schema=public"

JWT_SECRET="replace_with_a_strong_random_secret_at_least_32_characters"
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Use the port and variable names expected by your actual backend configuration.

Never commit `.env` files or expose database credentials and JWT secrets.

### Step 4 — Generate Prisma Client

```bash
npm run prisma:generate --workspace=server
```

### Step 5 — Apply database migrations

For an existing migration history:

```bash
npm run prisma:deploy --workspace=server
```

For local development, use the project's configured development migration command when appropriate.

Do not use development migration commands against production databases.

### Step 6 — Start the application

Run the configured development command from the repository root:

```bash
npm run dev
```

Alternatively, use the individual workspace scripts:

```bash
npm run dev --workspace=client
```

```bash
npm run dev --workspace=server
```

Default local addresses, depending on your configuration:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Health API | http://localhost:8000/api/health |

---

## 8. API Documentation

Base URL:

```text
/api
```

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/signup` | Create organization and administrator account | No |
| POST | `/api/auth/login` | Authenticate and obtain JWT | No |
| GET | `/api/auth/me` | Retrieve authenticated user and organization | Yes |

### Products

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/products` | List organization products | Yes |
| GET | `/api/products/:id` | Retrieve a product | Yes |
| POST | `/api/products` | Create a product | Yes |
| PUT | `/api/products/:id` | Update a product | Yes |
| DELETE | `/api/products/:id` | Delete a product | Yes |
| PATCH | `/api/products/:id/adjust-stock` | Adjust inventory quantity | Yes |

Product listing supports the implemented search and low-stock filters.

### Dashboard

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Retrieve inventory summary and low-stock items | Yes |

### Settings

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/settings` | Retrieve organization settings | Yes |
| PUT | `/api/settings` | Update organization settings | Yes |

### Health

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/health` | Check backend health | No |

**Authentication:** Protected API endpoints use the JWT Bearer authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Refer to the actual route definitions and validators for exact request and response schemas.

---

## 9. Testing and Quality Assurance

StockFlow includes backend integration tests and frontend route tests.

### Current reported verification

| Test category | Reported result |
|---|---:|
| Backend integration tests | 37/37 passed |
| Frontend route and guard tests | 20/20 passed |
| Total | 57/57 passed |

### Backend test coverage

- Health endpoint.
- Signup and login.
- Password and token security.
- Authentication middleware.
- Multi-tenant isolation.
- Organization-scoped product operations.
- SKU uniqueness.
- Atomic stock adjustments.
- Concurrent stock updates.
- Negative stock prevention.
- Low-stock calculations.
- Inclusive threshold equality.
- Dashboard calculations.
- Organization settings.
- Product deletion and cleanup.
- CORS preflight behavior.

### Frontend test coverage

- Public routes.
- Protected routes.
- Authentication lifecycle.
- React Router 7 navigation.
- Navigation active states.
- Route guard behavior.

### Run all tests

From the repository root:

```bash
npm test
```

Run backend tests independently:

```bash
npm --prefix server test
```

Run frontend tests independently:

```bash
npm --prefix client test
```

### Production build

```bash
npm run build --workspace=client
```

### Dependency checks

```bash
npm ls --all
```

```bash
npm audit
```

Review any development-only advisories separately from production dependency exposure. Do not assume a clean production audit means the entire development dependency tree is vulnerability-free.

*Test counts represent the latest reported local verification and should be updated whenever the test suite changes. They do not independently establish production deployment health.*

---

## 10. Production Deployment

StockFlow uses a separate frontend and backend deployment architecture.

### A. PostgreSQL Database

A cloud PostgreSQL provider such as Neon can host the production database.

1. Create a PostgreSQL database.
2. Obtain the connection string.
3. Configure `DATABASE_URL` in the backend hosting environment.
4. Generate Prisma Client during the build.
5. Apply committed migrations using `prisma migrate deploy`.

Example connection string:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

### B. Backend Deployment — Render

Backend service:

https://stock-flow-f9qq.onrender.com

Recommended configuration:

| Setting | Value |
|---|---|
| Repository | `madugushivakumar/Stock_Flow` |
| Branch | `main` |
| Root directory | `server` if commands are server-relative |
| Runtime | Node.js |
| Start command | `node src/server.js` if configured for the server directory |

Configure the required environment variables:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://stock-flow-theta-five.vercel.app
ALLOWED_ORIGINS=https://stock-flow-theta-five.vercel.app
```

Use the actual port and variable conventions expected by the backend and Render.

Ensure Prisma Client generation and database migrations are handled by the configured deployment process.

### C. Frontend Deployment — Vercel

Frontend:

https://stock-flow-theta-five.vercel.app

Configure the Vercel project using the repository's npm workspace structure.

Recommended settings when building from the repository root:

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Root directory | Repository root |
| Install command | `npm ci` |
| Build command | `npm run build --workspace=client` |
| Output directory | `client/dist` |

Configure this frontend environment variable:

```env
VITE_API_URL=https://stock-flow-f9qq.onrender.com/api
```

Ensure the Vercel SPA fallback configuration supports direct navigation and page refreshes on routes such as `/signup`, `/login`, and `/dashboard`.

### D. CORS Configuration

The backend must explicitly allow the deployed frontend origin:

```text
https://stock-flow-theta-five.vercel.app
```

Local development should also support:

```text
http://localhost:5173
```

CORS middleware must execute before authentication and API route middleware so browser OPTIONS preflight requests are handled correctly.

Only trusted origins should be allowed. Do not use unrestricted wildcard origins.

### E. Deployment Verification

Check the backend health endpoint:

https://stock-flow-f9qq.onrender.com/api/health

Check the frontend:

https://stock-flow-theta-five.vercel.app

For production CORS verification, run:

```powershell
curl.exe -i -X OPTIONS "https://stock-flow-f9qq.onrender.com/api/auth/signup" `
  -H "Origin: https://stock-flow-theta-five.vercel.app" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

The expected result is a successful preflight response containing:

```http
Access-Control-Allow-Origin: https://stock-flow-theta-five.vercel.app
```

A successful local test alone does not prove the deployed backend is correctly configured.

---

## 11. Security Considerations

StockFlow applies multiple layers of application security.

- Organization-scoped database queries.
- JWT-based protected API access.
- Password hashing.
- Input and payload validation.
- API rate limiting.
- Security response headers.
- Restricted CORS origins.
- Database constraints.
- Atomic inventory updates.
- Protected frontend navigation.

### Production security recommendations

- Use strong, unique JWT secrets.
- Store all secrets in hosting-provider environment variables.
- Never commit `.env` files.
- Use HTTPS in production.
- Restrict database access.
- Keep dependencies updated.
- Review dependency audit reports.
- Back up production data.
- Monitor backend errors and deployment logs.
- Test tenant isolation after security-related changes.

---

## 12. Current Deployment Links

| Resource | Link |
|---|---|
| GitHub repository | https://github.com/madugushivakumar/Stock_Flow |
| Vercel frontend | https://stock-flow-theta-five.vercel.app |
| Signup page | https://stock-flow-theta-five.vercel.app/signup |
| Backend API | https://stock-flow-f9qq.onrender.com |
| Backend health | https://stock-flow-f9qq.onrender.com/api/health |

**Deployment status:** The frontend and backend deployment configuration is documented above. Confirm the latest Render deployment and production CORS preflight before describing signup as fully operational.

---

## 13. Future Enhancements

Potential directions for future development include:

- Inventory movement history.
- Purchase order management.
- Supplier management.
- Barcode and QR code scanning.
- Multi-warehouse inventory.
- CSV and Excel import/export.
- Advanced inventory analytics.
- Automated reorder notifications.
- Role-based access control.
- Audit logs.
- Subscription and billing management.
- Real-time inventory updates.
- Integration with external accounting and commerce platforms.

These are potential enhancements, not claims about currently implemented functionality.

---

## 14. Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Run the existing test suite.
5. Submit a pull request describing your changes.

Keep changes focused and preserve existing authentication, tenant isolation, and API contracts.

---

## 15. License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>StockFlow</strong>
  <br />
  Simplifying inventory management through secure, intelligent, and scalable software.
</p>
