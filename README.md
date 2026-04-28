# TukPatrol API

**NIBM Student ID:** COBSCCOMP24.2P-019  
**Coventry Student ID:** 16115859  
**NIBM Student Name:** M. S. F. Shazna  
**Module:** NB6007CEM - Web API Development  
**Batch:** BSCCOMP_24.2P

---

## Overview

A RESTful API for real-time three-wheeler (tuk-tuk) tracking and 
movement logging for Sri Lanka Law Enforcement. The system collects 
GPS location pings from registered vehicles and provides live 
tracking, historical movement logs, and province/district/station 
filtering for operational use by police stations.

---

## Tech Stack

- Node.js / Express.js (ES Modules)
- MongoDB Atlas / Mongoose
- JWT Authentication (Bearer Token)
- Swagger UI (OpenAPI 3.0)
- express-validator — input validation
- bcryptjs — password hashing
- helmet — HTTP security headers
- express-rate-limit — rate limiting
- morgan — request logging

---

## Live API

| | URL |
|---|---|
| Base URL | https://tukpatrol-api.onrender.com |
| Swagger Docs | https://tukpatrol-api.onrender.com/api-docs |

---

## Setup & Run Locally

```bash
git clone https://github.com/WebAPI-CW/COBSCCOMP24.2P-019.git
cd COBSCCOMP24.2P-019
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run seed    # Initialize master data and location history (run once)
npm run dev     # Start API server + live simulator
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_EXPIRE` | Token expiry duration (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed CORS origin (default: `*`) |
| `NODE_ENV` | `development` or `production` |

See `.env.example` for reference.

---

## Data

TukPatrol has been running since April 16 2026.
Location pings are collected every 30 seconds from all
registered tuk-tuks via the live simulator.

### Setup
```bash
npm run seed    # Initialize master data (run once)
npm run dev     # Start API + live simulator
```

### Simulator

The simulator generates real-time location pings for all
200 registered tuk-tuks. Patterns are determined by the
actual current Sri Lanka time automatically:

- Morning rush hour — congestion patterns, slow speeds
- School hours — reduced speed, higher passenger count
- Night — most tuk-tuks parked
- April afternoons — monsoon rain speed reduction
- Weekends — no school/office rush patterns

Anomalies are detected and logged to the console in real time.
Stop with Ctrl+C for a full session summary.

---

## Demo Users

| Role | Email | Password |
|---|---|---|
| HQ_ADMIN | admin@slpolice.lk | Admin@1234 |
| PROVINCIAL | provincial@slpolice.lk | Provincial@1234 |
| STATION | station@slpolice.lk | Station@1234 |
| DEVICE | device001@slpolice.lk | Device@1234 |

---

## API Endpoints

Full documentation available at `/api-docs` (Swagger UI).

| Tag | Endpoints |
|---|---|
| Auth | POST /api/v1/auth/login, GET /api/v1/auth/me |
| Provinces | GET, POST /api/v1/provinces — GET, PATCH, DELETE /api/v1/provinces/:id |
| Districts | GET, POST /api/v1/districts — GET, PATCH, DELETE /api/v1/districts/:id |
| Users | GET, POST /api/v1/users — GET, PATCH /api/v1/users/:id |
| Police Stations | GET, POST /api/v1/police-stations — GET, PATCH, DELETE /api/v1/police-stations/:id |
| TukTuks | GET, POST /api/v1/tuktuks — GET, PATCH, DELETE /api/v1/tuktuks/:id |
| Location | POST /api/v1/tuktuks/:id/ping, GET /api/v1/tuktuks/:id/location |
| Location | GET /api/v1/tuktuks/:id/history, GET /api/v1/tuktuks/:id/summary |
| Location | GET /api/v1/locations/live, GET /api/v1/locations/inactive |
| Location | GET /api/v1/locations/history, GET /api/v1/locations/anomalies |
| Location | GET /api/v1/locations/summary |

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production ready, deployed code |
| `develop` | Integration branch — PRs merge here first |
| `feature/*` | New feature development |
| `fix/*` | Bug fixes |
| `docs/*` | README, Swagger, comments |
| `chore/*` | Config, dependencies |
| `seed/*` | Data seeding work |

---

## Development Process

| Branch | Description |
|---|---|
| `feature/project-setup` | Initial Express and Mongoose project structure |
| `feature/models` | All Mongoose schemas |
| `feature/auth` | JWT authentication and role based access control |
| `feature/boundaries` | Province, district and station CRUD endpoints |
| `feature/vehicles` | Vehicle registration and management endpoints |
| `feature/location` | Location ping, history and live tracking endpoints |
| `feature/seed-data` | Simulation data seed script and JSON export files |
| `feature/swagger` | Swagger UI documentation for all endpoints |

---

## Limitations & Further Concerns

- **Real-time tracking** — Uses polling based location updates. 
  True real-time would require WebSockets or Server-Sent Events.
- **Geospatial queries** — No `2dsphere` index. Radius based 
  queries are not supported without full collection scan.
- **JWT revocation** — Tokens cannot be invalidated before expiry. 
  A token blacklist would be needed in production.
- **GPS spoofing** — Device reported coordinates are trusted. 
  No server side spoofing detection is implemented.
- **Scalability** — Single MongoDB Atlas cluster with no read 
  replicas. High concurrent load would bottleneck queries.
- **Rate limiting** — Applied per IP. No per device throttle 
  on the ping endpoint.
- **Field Projection** — No `?fields=` query parameter support.
  All responses return the full resource representation.

---

## WSO2 API Design Notes

This API follows WSO2 REST API Design Guidelines and the Richardson
Maturity Model Level 2:

- **Collection resources** — `/provinces`, `/districts`, `/stations`,
  `/vehicles`, `/locations` use plural nouns.
- **Atomic resources** — `/:id` sub-paths identify individual records.
- **Controller resources** — `/api/v1/vehicles/:id/deactivate` (PUT)
  and `/api/v1/vehicles/:id/ping` (POST) are intentional controller
  resources using verbs, as permitted by WSO2 guidelines for
  state-change and data-submission actions that do not map cleanly
  to a standard CRUD method.
- **URI versioning** — All routes are prefixed with `/api/v1/`.
- **Error format** — All error responses include `code`, `message`,
  `description`, and `moreInfo` fields per WSO2 Section 8.