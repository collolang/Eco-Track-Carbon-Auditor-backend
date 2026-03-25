# EcoTrack Backend API

Node.js + Express + PostgreSQL (via Prisma ORM) backend for the EcoTrack Carbon Footprint Tracker.

---

## 🗄️ Database: PostgreSQL

**Why PostgreSQL?**
- Relational structure perfectly fits: Users → Companies → EmissionEntries
- Excellent for time-series queries (monthly/yearly analytics)
- Raw SQL support for aggregations (yearly totals)
- Free, open-source, production-ready

**Recommended Hosting (pick one):**
| Provider  | Free Tier | Notes |
|-----------|-----------|-------|
| **Supabase** | ✅ 500MB | Easiest setup, good dashboard |
| **Railway** | ✅ $5 credit | Simple deploy |
| **Neon** | ✅ 512MB | Serverless Postgres |
| **Local** | ✅ Free | Install PostgreSQL locally |

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd ecotrack-backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secrets
```

### 3. Set up the database
```bash
# Push schema to your database
npm run db:push

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 4. Seed demo data
```bash
npm run db:seed
# Creates demo user: demo@ecotrack.com / password123
```

### 5. Start the server
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

---

## 📁 Project Structure

```
ecotrack-backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Demo data seeder
├── src/
│   ├── config/
│   │   ├── database.js    # Prisma client singleton
│   │   └── jwt.js         # JWT configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── emissionsController.js
│   │   └── reportsController.js
│   ├── middleware/
│   │   ├── auth.js        # JWT verification
│   │   ├── errorHandler.js
│   │   └── validate.js    # Input validation
│   ├── routes/
│   │   ├── auth.js
│   │   ├── company.js
│   │   ├── emissions.js
│   │   └── reports.js
│   ├── utils/
│   │   └── carbonCalculator.js
│   ├── app.js             # Express app setup
│   └── server.js          # Entry point
├── .env.example
└── package.json
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Get current user |

### Company Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/profile` | Get company info |
| PUT | `/api/company/profile` | Create/update company |

### Emissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emissions` | Get all entries |
| POST | `/api/emissions` | Create entry |
| GET | `/api/emissions/monthly` | Monthly chart data |
| GET | `/api/emissions/breakdown` | Pie chart data |
| GET | `/api/emissions/total` | Current month total |
| GET | `/api/emissions/yearly` | Year-over-year data |
| GET | `/api/emissions/:id` | Single entry |
| PUT | `/api/emissions/:id` | Update entry |
| DELETE | `/api/emissions/:id` | Delete entry |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports?month=March&year=2026` | Generate report |
| GET | `/api/reports/history` | Past reports list |

---

## 🔐 Authentication Flow

1. Register/Login → receive `accessToken` (15min) + `refreshToken` (7 days)
2. Include `Authorization: Bearer <accessToken>` on all protected requests
3. When access token expires (401), frontend auto-calls `/auth/refresh`
4. Refresh tokens are rotated on each use (stored in DB, revocable)

---

## 🌍 Frontend Integration

Replace your `src/services/api.js` with `api-frontend-updated.js` (included in this folder).

Add to your frontend `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

---

## 📊 Database Schema Summary

```
users          ─┐
                ├─ company (1:1)
                └─ emission_entries (1:many)

emission_entries:
  - month, year (unique per user)
  - electricityKwh → scope2Emissions
  - fuelType + fuelQuantity → scope1Emissions
  - wasteKg + wasteType + flightKm → scope3Emissions
  - totalEmissions (pre-calculated)
```
