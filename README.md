# 💸 FinanceFlow

> Financial management system for small businesses — full-stack application built with modern technologies, from authentication to interactive dashboards with charts and data export.

🔗 **[Live Demo](https://financesflow.vercel.app)** (click **Entrar como admin** to explore without signing up) · 📦 **[Backend API](https://financeflow-api-n4vi.onrender.com)**

> ⚠️ **Note:** The backend is hosted on Render's free tier and may take up to 1 minute to wake up after inactivity. Please wait a moment if the first request is slow.

---

## 📸 Preview

<img src="docs/screenshots/dashboard.jpg" alt="FinancesFlow dashboard: monthly balance on a banknote-blue card, account balances, spending by category and yearly cash flow" width="100%" />

---

## 🚀 Features

- 🔐 **Authentication** — Register and login with JWT stored in httpOnly cookies
- 👀 **Demo login** — One click on "Entrar como admin" opens a demo account with a year of sample data from a fictional bakery. The data is recreated weekly or when visitors delete most of it
- 📊 **Dashboard** — KPI cards, cash flow chart (Recharts), expense by category and recent transactions
- 💳 **Transactions** — Full CRUD with filters by type, month, account and text search
- 🏦 **Accounts** — Manage bank accounts with balance tracking, type and color
- 🏷️ **Categories** — Organize transactions with custom categories, type and color
- 📈 **Reports** — Monthly/yearly breakdown by category and account, with CSV export
- 📱 **Responsive** — Mobile-first layout with collapsible sidebar
- 🇧🇷 **Visual identity** — Palette taken from Brazilian Real banknotes, guilloché engraving on balances, monospaced figures for money

### Deploy checklist

| Where | What |
|-------|------|
| Render | `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production` |
| MongoDB Atlas | Cluster running (M0 pauses after long inactivity) and Network Access allowing `0.0.0.0/0` |
| Vercel | Nothing required. `API_URL` only if the API moves; `NEXT_PUBLIC_API_URL` is no longer used |

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
| Next.js 16 (App Router) | React framework, also proxies `/api` to the backend |
| TypeScript | Type safety |
| Tailwind CSS 4 | Utility-first styling with design tokens in `globals.css` |
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
- **Same-origin API proxy** — The browser only talks to the Vercel domain; Next.js rewrites `/api/*` to the Render API. The session cookie is first-party (`SameSite=Lax`), so it works in Safari, Firefox, Brave and incognito Chrome, which block third-party cookies between `vercel.app` and `onrender.com`
- **Resilient boot** — The API stays up if MongoDB is unreachable, retries the connection and reports it on `GET /api/health`

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

Create a `.env` file (see `backend/.env.example`):
```env
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/financeflow
JWT_SECRET=your_secret_key_here
# optional
CLIENT_URL=https://your-preview.vercel.app   # extra CORS origins, comma-separated
COOKIE_SAMESITE=lax                          # use "none" only if the frontend calls the API cross-site directly
DEMO_LOGIN=false                             # hides the demo account (on by default)
```

**Mock login (optional):** If MongoDB is slow to respond, add `MOCK_AUTH=true` to `.env`. This enables a fake user (`dev@mock.com` / `mock123`) that bypasses the database. Real registered users still authenticate normally.

Check `http://localhost:5000/api/health`: it should return `{"status":"ok","db":"connected"}`.

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file (optional, this is the default in development):
```env
API_URL=http://localhost:5000
```

In production, `API_URL` defaults to the Render API. Requests go to `/api/*` on the frontend and Next.js forwards them.

```bash
npm run dev
```

Access at `http://localhost:3000`

---

## 📡 API Endpoints

```
GET    /api/health

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/demo        # demo account, disable with DEMO_LOGIN=false
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
- **Cross-site cookies**: why they break between Vercel and Render, and how a same-origin proxy fixes it
- Custom **React hooks** with client-side caching strategy

---

## 👩‍💻 Author

**Samara Caldas**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/samaracaldas)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/samaracaldas)

---

> Built as a portfolio project to demonstrate full-stack development skills with modern technologies.
