# 💸 FinanceFlow

> Financial management system for small businesses — full-stack application built with modern technologies, from authentication to interactive dashboards with charts and data export.

🔗 **[Live Demo](https://financesflow.vercel.app)** · 📦 **[Backend API](https://financeflow-api-n4vi.onrender.com)**

> ⚠️ **Note:** The backend is hosted on Render's free tier and may take up to 1 minute to wake up after inactivity. Please wait a moment if the first request is slow.

---

## 📸 Preview

| Dashboard | Transactions | Reports |
|-----------|-------------|---------|
| KPI cards, bar charts, pie charts and recent transactions | Full CRUD with filters by type, month and account | Monthly/yearly breakdown with CSV export |

---

## 🚀 Features

- 🔐 **Authentication** — Register and login with JWT stored in httpOnly cookies
- 📊 **Dashboard** — KPI cards, cash flow chart (Recharts), expense by category and recent transactions
- 💳 **Transactions** — Full CRUD with filters by type, month, account and text search
- 🏦 **Accounts** — Manage bank accounts with balance tracking, type and color
- 🏷️ **Categories** — Organize transactions with custom categories, type and color
- 📈 **Reports** — Monthly/yearly breakdown by category and account, with CSV export
- 📱 **Responsive** — Mobile-first layout with collapsible sidebar

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| TypeScript | Type safety |
| MongoDB + Mongoose | Database and ODM |
| JWT + bcrypt | Authentication and password hashing |
| Zod | Schema validation |
| Cookie-parser | httpOnly cookie management |

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 15 (App Router) | React framework with SSR |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| Recharts | Interactive charts |
| Axios | HTTP client with credentials |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database (M0 free tier) |
| Render | Backend hosting |
| Vercel | Frontend hosting |
| GitHub | Version control |

---

## 🏗️ Architecture

```
financeflow/
├── backend/                  # Node.js + Express API
│   └── src/
│       ├── config/           # Database connection
│       ├── controllers/      # Business logic
│       ├── middlewares/      # Auth middleware
│       ├── models/           # Mongoose schemas
│       ├── routes/           # Express routes
│       └── utils/            # Token generation
│
└── frontend/                 # Next.js App Router
    └── src/
        ├── app/
        │   ├── (auth)/       # Login/register pages
        │   └── (dashboard)/  # Protected pages
        │       ├── dashboard/
        │       ├── transactions/
        │       ├── accounts/
        │       ├── categories/
        │       └── reports/
        ├── lib/
        │   ├── api.ts        # Axios instance
        │   └── hooks/        # Custom hooks with cache
        └── types/            # TypeScript interfaces
```

---

## 🔑 Key Technical Decisions

- **JWT in httpOnly cookies** — More secure than localStorage, prevents XSS attacks
- **Zod validation** — Runtime schema validation on all API endpoints
- **Custom hooks with cache** — Module-level cache to avoid unnecessary re-fetches
- **Mongoose populate** — Avoids N+1 queries by joining category and account data
- **Next.js App Router** — Route groups `(auth)` and `(dashboard)` for layout separation
- **CORS with credentials** — Configured to allow cross-origin cookies between Vercel and Render

---

## ⚙️ Running Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/financeflow
JWT_SECRET=your_secret_key_here
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Access at `http://localhost:3000`

---

## 📡 API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PUT    /api/transactions/:id
DELETE /api/transactions/:id

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id

GET    /api/accounts
POST   /api/accounts
PUT    /api/accounts/:id
DELETE /api/accounts/:id
```

---

## 🎯 What I Learned

- Building a **production-ready REST API** with Express + TypeScript
- **JWT authentication** with httpOnly cookies for security
- **MongoDB aggregations** and populate for relational-like queries
- **Next.js App Router** with route groups and nested layouts
- **Full-stack deployment** with Render + Vercel + MongoDB Atlas
- **CORS configuration** for cross-origin authentication
- Custom **React hooks** with client-side caching strategy

---

## 👩‍💻 Author

**Samara Caldas**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/samaracaldas)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/samaracaldas)

---

> Built as a portfolio project to demonstrate full-stack development skills with modern technologies.