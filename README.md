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
npm run dev
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

## Seed Data

Run `npm run seed` to populate the database:

- 9 provinces (all Sri Lanka provinces)
- 25 districts (all Sri Lanka districts)
- 25 police stations mapped to districts
- 200 registered tuk-tuks with province-accurate registration numbers
- 14,000 location pings spanning 1 week of movement history
- 3 demo users across different roles

Static JSON files are available in the `/data` folder as simulation 
data evidence. `sample-pings.json` shows 70 pings for vehicle 
DEV-0001 over one week as a representative sample.

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
| Auth | POST /api/v1/auth/login, POST /api/v1/auth/register, GET /api/v1/auth/me |
| Provinces | GET, POST /api/v1/provinces — GET, PUT, DELETE /api/v1/provinces/:id |
| Districts | GET, POST /api/v1/districts — GET, PUT, DELETE /api/v1/districts/:id |
| Stations | GET, POST /api/v1/stations — GET, PUT, DELETE /api/v1/stations/:id |
| Vehicles | GET, POST /api/v1/vehicles — GET, PUT, DELETE /api/v1/vehicles/:id |
| Location | POST /api/v1/vehicles/:id/ping — GET /api/v1/vehicles/:id/location |
| Location | GET /api/v1/vehicles/:id/history — GET /api/v1/locations/live |

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