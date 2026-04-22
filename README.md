# TukPatrol API

**Student ID:** COBSCCOMP24.2P-019  
**Module:** NB6007CEM - Web API Development  
**Batch:** BSCCOMP_24.2P

## Overview

A RESTful API for real-time three-wheeler (tuk-tuk) tracking and movement logging for Sri Lanka Law Enforcement. The system collects GPS location pings from registered vehicles and provides live tracking, historical movement logs, and province/district-wise filtering for operational use by police stations.

## Tech Stack

- Node.js / Express.js (ES Modules)
- MongoDB Atlas / Mongoose
- JWT Authentication (Bearer Token)
- Swagger UI (OpenAPI 3.0)
- express-validator, bcryptjs, helmet, cors, express-rate-limit

## Live API

Base URL: --  
Swagger Docs: --

## Setup & Run Locally

```bash
git clone https://github.com/WebAPI-CW/COBSCCOMP24.2P-019.git
cd COBSCCOMP24.2P-019
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `JWT_EXPIRE` | JWT expiry duration (e.g. `7d`) |
| `CORS_ORIGIN` | Allowed domains for CORS (default: `*`) |
| `NODE_ENV` | `development` or `production` |

## Demo Users (after running seed)

| Role | Email | Password |
|---|---|---|
| HQ_ADMIN | admin@slpolice.lk | Admin@1234 |
| PROVINCIAL | provincial@slpolice.lk | Provincial@1234 |
| STATION | station@slpolice.lk | Station@1234 |
| DEVICE | device001@slpolice.lk | Device@1234 |

## Seed Data

Run `npm run seed` to populate the database with simulation data:
- 9 provinces, 25 districts, 25 police stations
- 200 registered tuk-tuks with province-accurate registration numbers
- 14,000 location pings spanning 1 week of movement history
- 4 demo users (HQ_ADMIN, PROVINCIAL, STATION, DEVICE roles)

## Branching Strategy

- `main` - production-ready code
- `develop` - integration branch (PRs merge here first)
- `feature/*` - new feature development
- `fix/*` - bug fixes
- `docs/*` - README, Swagger, comments
- `chore/*` - config, dependencies
- `seed/*` - data seeding work

## API Endpoints

See Swagger docs at `/api-docs`

## Limitations & Further Concerns

### Real-Time Tracking
- The system uses **polling-based location updates** (periodic GPS pings). True real-time tracking would require WebSocket or Server-Sent Events (SSE), which is not implemented.

### Geographic Querying
- Location pings are stored as flat latitude/longitude fields. There is **no `2dsphere` geospatial index**, so radius-based queries (e.g. "find all vehicles within 5km of Colombo Fort") are not supported without a full collection scan.

### Rate Limiting
- Rate limiting is applied per IP address (100 req / 15 min). There is **no per-device throttle** on the ping endpoint, meaning a compromised device token could flood the system with fake pings before the IP limit triggers.

### GPS Spoofing
- The ping endpoint trusts coordinates reported by the device. There is **no server-side GPS spoofing detection** — an invalid device could submit false locations.

### Scalability
- The API is deployed on a **single MongoDB Atlas cluster** with no read replicas. Under high concurrent read load (many police stations querying `/locations/live` simultaneously), query throughput would be a bottleneck.

### Security
- JWT tokens do not support revocation (no token blacklist). A stolen token remains valid until expiry.
- Password reset is not implemented.
