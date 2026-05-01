# TukPatrol API — Project Report

**Module:** NB6007CEM — Web API Development  
**Student:** M. S. F. Shazna  
**NIBM ID:** COBSCCOMP24.2P-019  
**Coventry ID:** 16115859  
**Batch:** BSCCOMP_24.2P  
**Submitted to:** Niranga Dharmaratna  

---

## Table of Contents

1. Business Requirements Analysis
2. Design — Thought Process, Considerations and Standards
3. Architecture — Decisions and Justification
4. Implementation — Key Technical Choices
5. Limitations, Scaling and Further Concerns
6. Appendix — Deployment Details

---

## 1. Business Requirements Analysis

### 1.1 Background and Scope

Sri Lanka has an estimated 1.1 million registered three-wheelers (tuk-tuks), making them one of the most common and least-regulated forms of public transport in the country. Law enforcement agencies face significant challenges in tracking movements, investigating incidents, and maintaining operational visibility over these vehicles. The business case presented by the Sri Lanka Police requires a centralised, real-time tuk-tuk tracking platform capable of supporting day-to-day operational visibility and criminal investigations.

The system was scoped explicitly as an **API-only** deliverable for the initial stage. No mobile application, web frontend, or tracking device firmware was required. The API is intended to serve three distinct consumer groups: police headquarters / provincial control administrators, station-level law enforcement users, and tuk-tuk-mounted GPS tracking devices.

### 1.2 Stakeholder Analysis

Three categories of stakeholder were identified and mapped to user roles in the system:

| Stakeholder | Role Assigned | Primary Needs |
|---|---|---|
| HQ / Provincial Control | `HQ_ADMIN`, `PROVINCIAL` | Full fleet visibility, user management, data export, national-level filtering |
| Police Station Officers | `STATION` | District/station-level tracking, historical investigation queries |
| GPS Tracking Devices | `DEVICE` | Authenticated location ping submission only |

This stakeholder mapping directly informed the Role-Based Access Control (RBAC) design described in Section 3.

### 1.3 Functional Requirements

The following functional requirements were derived from the business case:

**Vehicle Management**
- Register a tuk-tuk with driver identity, vehicle registration number, device ID, and administrative boundary linkage (province → district → station).
- List, retrieve, update, and deactivate registered tuk-tuks.
- Filter tuk-tuks by province, district, station, and active status.

**Location Tracking**
- Accept GPS location pings from authenticated devices (latitude, longitude, speed, heading, timestamp).
- Retrieve the last-known location for any individual tuk-tuk.
- Retrieve paginated time-window history for a single tuk-tuk.
- Retrieve live positions of all active tuk-tuks (province/district/station filterable).
- Detect signal-lost vehicles (no ping within a configurable hours threshold).
- Detect anomalous pings across all tuk-tuks (overspeed, signal loss, and abnormal behaviour) via a configurable threshold, both fleet-wide and per individual vehicle.
- Provide a fleet summary by province (aggregate count of active vehicles).

**Administrative Boundaries**
- Full CRUD for provinces, districts, and police stations.
- All boundary resources are hierarchical: district references a province; station references both district and province.

**User Management**
- Role-based user accounts with bcrypt password hashing.
- JWT-based authentication for all protected endpoints.
- HQ_ADMIN can create, list, update, and deactivate user accounts.

**Simulation**
- Master data for all 9 provinces and 25 districts of Sri Lanka.
- At least 25 police stations mapped to districts.
- At least 200 registered tuk-tuks distributed across provinces.
  - At least 10 days of location history with realistic movement patterns. Location pings are transmitted at 30-second intervals from registered devices, reflecting real IoT device transmission rates.

### 1.4 Non-Functional Requirements

- **Security:** All endpoints (except login) must require a valid Bearer token. Role checks must prevent privilege escalation.
- **Standards compliance:** The API must follow REST principles and WSO2 REST API Design Guidelines. OpenAPI 3.0 documentation must be provided.
- **Performance:** Pagination must be applied to all collection endpoints. Database indexes must be used for high-frequency query patterns.
- **Resilience:** Centralised error handling must return consistent, machine-readable error envelopes for all failure conditions.
- **Auditability:** GitHub commit history must demonstrate incremental, professional development practice.

---

## 2. Design — Thought Process, Considerations and Standards

### 2.1 API Design Philosophy

The API was designed according to the **Richardson Maturity Model Level 2**, in alignment with WSO2 REST API Design Guidelines. This means the API uses:

- HTTP verbs semantically: `GET` for retrieval, `POST` for creation, `PATCH` for partial update, `DELETE` for hard delete.
- Noun-based resource paths using plural names: `/provinces`, `/districts`, `/police-stations`, `/tuktuks`, `/locations`, `/users`.
- Sub-resource paths for hierarchical relationships: `GET /tuktuks/:id/history`, `POST /tuktuks/:id/ping`.
- Standard HTTP status codes for all outcomes (200, 201, 204, 304, 400, 401, 403, 404, 409, 422, 429, 500).

The decision to use Level 2 rather than Level 3 (HATEOAS) was deliberate. HATEOAS introduces significant implementation complexity and payload overhead that is not justified for a law-enforcement operational API where consumers are known, fixed, and controlled. Navigation links are provided only for pagination (`next`, `previous`) where they deliver concrete client value.

### 2.2 Resource Hierarchy Design

A key design decision was the three-tier administrative boundary hierarchy: **Province → District → Station**. Every tuk-tuk and every user account is anchored to all three levels simultaneously. This allows any query to be filtered at province, district, or station granularity without requiring a JOIN-like traversal up the tree at query time.

An alternative design considered was storing only the lowest-level boundary (station) and resolving province/district by reference. This was rejected because it would require multiple round-trips or a `$lookup` aggregation pipeline on every filtered query, adding latency and complexity. Redundant province/district fields on TukTuk and User documents trades a small amount of write-time data consistency overhead for significantly faster read queries — an acceptable trade-off for a read-heavy tracking system.

### 2.3 HTTP Method Selection — PATCH over PUT

All update operations use `PATCH` rather than `PUT`. This is the correct semantic choice for partial updates: a client updating only a tuk-tuk's `driverContact` field should not be required to resend the entire document. `PUT` implies idempotent full-document replacement and would silently clear any fields not included in the request body. The service layer uses an explicit field whitelist to build the update object, which also prevents mass-assignment vulnerabilities.

### 2.4 Conditional GET and ETag Support

A custom `etagMiddleware` was implemented to satisfy the WSO2 guideline on Conditional GET (RFC 7232). On every successful `GET` or `HEAD` response, the middleware computes an MD5 hash of the JSON body — serialised using the same `sltReplacer` that Express applies globally — and sets it as a strong `ETag` header. If a subsequent request arrives with a matching `If-None-Match` header, the server returns `304 Not Modified` with no body. `HEAD` is supported on all collection and individual resource routes, returning identical headers to `GET` but with no response body, in line with WSO2 REST API Design Guidelines. For write operations, the `validateIfMatch` helper recomputes the ETag from the current document using the same serialiser, ensuring that `If-Match` round-trips (GET → ETag → PATCH with `If-Match`) work correctly and return `412 Precondition Failed` only when the resource has genuinely changed.

### 2.5 Error Response Envelope

All error responses follow the WSO2 Section 8 error format:

```json
{
  "code": "404",
  "message": "Not Found",
  "description": "TukTuk not found",
  "moreInfo": ""
}
```

This envelope is consistently produced by the centralised `errorHandler` middleware, regardless of whether the error originates from a controller, a service, or a Mongoose operation. Mongoose-specific errors (CastError for invalid ObjectIds, duplicate key 11000) are intercepted and mapped to appropriate HTTP status codes (400 and 409 respectively) before reaching the client. This prevents internal Mongoose error details from leaking to API consumers.

### 2.6 Input Validation

All write operations use `express-validator` middleware chains to validate and sanitise request bodies before they reach the controller layer. Validation rules are co-located with their respective route files and exported as named arrays (e.g., `validateTukTuk`, `validatePing`). The ping endpoint applies Sri Lanka geographic bounds validation — latitude must fall within 5.9°N–9.9°N and longitude within 79.7°E–81.9°E — to reject clearly implausible coordinates at the API boundary rather than storing bad data. The `validatePing` chain also validates all telemetry fields at the boundary: `batteryLevel` is constrained to 0–100, `signalStrength` is validated against the enum `['strong', 'moderate', 'weak', 'none']`, `isEngineOn` is type-checked as boolean, and `passengerCount` is constrained to the integer range 0–3.

### 2.7 Rate Limiting and Security Headers

The API applies `express-rate-limit` to all `/api/` routes, permitting a maximum of 100 requests per IP per 15-minute window. This mitigates brute-force attacks on the login endpoint and prevents unintentional or malicious request floods from overwhelming the server. The rate limit response uses the same error envelope format as all other errors for consistency.

`helmet` is applied globally to set secure HTTP response headers (including `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy`) without any custom configuration, hardening the API against a range of common web vulnerabilities.

### 2.8 OpenAPI Documentation

All routes are documented using JSDoc-style Swagger annotations inline with the route definitions. The `swagger-jsdoc` library parses these annotations at startup and generates a full OpenAPI 3.0 specification, served at `/api-docs` via `swagger-ui-express`. Component schemas (`Province`, `District`, `PoliceStation`, `User`, `TukTuk`, `LocationPing`, `Error`) and reusable response definitions (`Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, etc.) are defined once in `swagger.js` and referenced throughout route annotations using `$ref`, keeping the specification DRY. Endpoints are organised into eight logical tag groups — **Auth**, **Users**, **TukTuks**, **Location**, **Anomalies**, **Provinces**, **Districts**, and **Police Stations** — so that operational endpoints (tracking, anomaly detection) appear at the top and administrative boundary endpoints appear at the bottom.

### 2.9 Additional WSO2 Compliance Points

Several further WSO2 REST API Design Guidelines are implemented beyond the core decisions described above:

- **Referential integrity — 409 Conflict**: Attempting to delete a province that has assigned districts, a district that has assigned stations, or a station that has assigned tuk-tuks returns `409 Conflict` rather than silently succeeding. This prevents orphaned records without requiring cascade deletes and follows WSO2 Section 9 guidance on meaningful error responses.
- **Content negotiation — 406 Not Acceptable**: A middleware layer on all `/api/` routes inspects the `Accept` header. Requests that explicitly exclude `application/json` (e.g., `Accept: text/html`) receive a `406 Not Acceptable` response using the standard WSO2 error envelope, in line with WSO2 Section 10.1.
- **Natural key lookup via query parameters**: Individual resource endpoints use MongoDB ObjectId path parameters for direct access. Human-readable identifiers (`registrationNumber`, `code`, `email`) are exposed as query filters on collection endpoints, allowing clients to discover the ObjectId for a known natural key (e.g. `GET /api/v1/tuktuks?registrationNumber=WP-0001`) before navigating to the individual resource. This keeps URLs stable even if natural keys change.

---

## 3. Architecture — Decisions and Justification

### 3.1 Overall Architecture

The API follows a layered, three-tier architecture composed of the following layers:

```
Request
  ↓
Route (Express Router + Swagger annotations)
  ↓
Middleware (auth, validate, etag, rateLimit, errorHandler)
  ↓
Controller (HTTP concern — parse req, call service, send res)
  ↓
Service (business logic — queries, calculations, rule enforcement)
  ↓
Model (Mongoose schema + pre-save hooks)
  ↓
MongoDB Atlas
```

This separation of concerns ensures that business rules are never scattered across route handlers. Controllers are intentionally thin — they extract request parameters, delegate to a service function, and send the response. All domain logic (e.g., haversine distance calculation in `getTukTukSummary`, aggregation pipeline construction in `getLiveLocations`, idempotency checks in `updateTukTuk`) lives in the service layer and is independently testable without an HTTP layer.

### 3.2 Technology Choices

**Node.js / Express.js (ES Modules)**  
Node.js was the mandated runtime. Express.js was chosen as the HTTP framework for its maturity, extensive middleware ecosystem, and lightweight footprint. ES Modules (`"type": "module"` in `package.json`) were adopted over CommonJS to align with modern JavaScript standards and enable top-level `await` in configuration scripts.

**MongoDB Atlas / Mongoose**  
MongoDB was selected as the data store for two primary reasons. First, location pings are naturally document-shaped with no relational joins required between a ping and its coordinates. Second, MongoDB's aggregation pipeline (`$group`, `$lookup`, `$sort`) provides a powerful mechanism for the live-location query, which requires fetching the most recent ping per tuk-tuk across the entire active fleet in a single database round-trip. A compound index on `{ tukTuk: 1, timestamp: -1 }` on the `LocationPing` collection ensures this aggregation performs efficiently even as the ping volume grows to millions of documents.

Mongoose was used as the ODM to define schemas with field-level validation, automatic timestamping (`{ timestamps: true }`), and pre-save hooks (bcrypt password hashing in the User model).

**JWT Authentication**  
JSON Web Tokens (signed with HS256 using `jsonwebtoken`) were chosen for stateless authentication. Each token encodes the user's `_id`, which the `protect` middleware uses to look up the full user document on every request. This allows the `isActive` flag to be checked on every authenticated request — if an administrator deactivates an account, the next request from that user will receive a 401 even if their token has not yet expired.

**Render.com (Deployment)**  
The API is deployed on Render.com as a Node.js web service. Render provides automatic HTTPS, environment variable management, and GitHub-integrated continuous deployment from the `main` branch. MongoDB Atlas is used as the cloud database, with the Atlas cluster's IP access list configured to allow all sources (`0.0.0.0/0`) for the Render deployment (Render does not expose static outbound IPs on the free tier).

### 3.3 Data Model

Six Mongoose models were defined:

| Model | Key Fields | Relationships |
|---|---|---|
| `Province` | name, code | — |
| `District` | name, code, province (ref) | → Province |
| `PoliceStation` | name, code, district (ref), province (ref) | → District, Province |
| `User` | name, email, password (hashed), role, province (ref), district (ref), station (ref), isActive | → Province, District, PoliceStation |
| `TukTuk` | registrationNumber, deviceId, driverName, driverNIC, driverContact, province (ref), district (ref), station (ref), isActive | → Province, District, PoliceStation |
| `LocationPing` | tukTuk (ref), latitude, longitude, speed, heading, timestamp, batteryLevel, signalStrength, isEngineOn, passengerCount | → TukTuk |

The `LocationPing` model carries a compound index `{ tukTuk: 1, timestamp: -1 }` to support the two most frequent query patterns: retrieving the most recent ping for a single vehicle (`getLastLocation`) and retrieving time-ordered history for a vehicle (`getLocationHistory`).

### 3.4 Branching Strategy

A Git Flow-inspired branching model was adopted:

| Branch | Purpose |
|---|---|
| `main` | Production-ready code, merged only via PR |
| `develop` | Integration branch, all features merge here first |
| `feature/*` | Individual feature development |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation updates |
| `seed/*` | Data seeding and export work |

Feature branches included: `feature/project-setup`, `feature/models`, `feature/auth`, `feature/boundaries`, `feature/vehicles`, `feature/location`, `feature/seed-data`, `feature/swagger`. This approach ensured that the `develop` branch always contained a working, integrated build and the `main` branch was only updated when a release was production-ready.

### 3.5 Testing Strategy

The test suite is implemented using **Vitest** and **Supertest** with **mongodb-memory-server** providing an in-process MongoDB instance for isolation. Two test categories are maintained:

- **Unit tests** (`tests/unit/`): Test service functions in isolation by directly invoking them against the in-memory database. Covers `authService`, `locationService`, `tuktukService`, and `userService`.
- **Acceptance tests** (`tests/acceptance/`): Test the full HTTP stack via Supertest. Covers `auth`, `provinces`, `districts`, `stations`, `tuktuks`, `users`, `security` (unauthenticated/forbidden access scenarios), and `etag` (conditional GET, `If-Match` round-trip, HEAD method, sorting, and nested resource routes).

The full test suite comprises **171 passing tests** across **18 test files**, achieving complete coverage of all routes, role-restriction rules, validation edge cases, and pagination behaviour.

---

## 4. Implementation — Key Technical Choices

### 4.1 Pagination

All collection endpoints support cursor-style pagination via `?page=` and `?limit=` query parameters. A reusable `getPaginationData` utility function in `src/utils/paginationHelper.js` handles the `countDocuments`, `skip`, `limit`, and `sort` pipeline for any Mongoose model with any filter object. Responses include `page`, `total`, `offset`, `limit`, `next`, and `previous` fields, where `next` and `previous` are fully-formed relative URL strings preserving all active filters.

### 4.2 Sorting

The `getPaginationData` helper supports client-driven sorting via a `?sort=field:asc` or `?sort=field:desc` query parameter. The tuktuks endpoint, for example, accepts `?sort=registrationNumber:asc`. If no client sort is specified, the caller-specified `sortOptions` argument is used (e.g., `{ timestamp: -1 }` for location history). The fallback is `{ createdAt: -1 }` (newest first).

### 4.3 Location Intelligence Features

Beyond the basic ping and history endpoints, the API implements several higher-order analytical features:

- **`POST /tuktuks/:id/ping`**: Accepts a GPS ping from an authenticated DEVICE. Validates all telemetry fields and records the ping with a server-assigned UTC timestamp.
- **`GET /tuktuks/:id/location`**: Returns the latest live location and telemetry for a specific vehicle — the most recent ping on record.
- **`GET /locations/live`**: Returns the latest live positions of all active tuk-tuks, paginated and filterable by province, district, and station.
- **`GET /locations/inactive`**: Identifies tuk-tuks whose last ping timestamp is older than a configurable `hours` threshold. Returns the last known position, hours since last ping, and a status of either `signal_lost` or `never_pinged`. Grouped under the **Anomalies** tag as signal loss is an operational anomaly.
- **`GET /locations/anomalies`** and **`GET /tuktuks/:id/anomalies`**: Query for anomalous pings — currently threshold-based overspeed detection (default 70 km/h) — either fleet-wide or for a specific vehicle by registration number. Results are paginated and sorted by speed descending. The fleet-wide endpoint enriches each ping with the tuk-tuk's registration number and driver name.
- **`GET /tuktuks/:id/summary`**: Computes a movement summary for a given vehicle over a user-specified time window, including total pings, first/last seen timestamps, approximate distance travelled (using the haversine formula), average speed, and maximum speed.
- **`GET /locations/summary`**: Uses a MongoDB aggregation pipeline to return the count of active tuk-tuks grouped by province — useful for a command dashboard overview.

### 4.4 Simulation Data Generation

The simulation data pipeline is built around three files with distinct, non-overlapping responsibilities:

**`data/simulationHelper.js` — Pattern Engine (shared)**

The single source of truth for all pattern decisions. Contains 14 traffic patterns based on Sri Lanka time (UTC+5:30) — including SCHOOL_RUSH, OFFICE_RUSH, MONSOON_WINDOW, DEAD_NIGHT, SATURDAY_MARKET, and SUNDAY_RELIGIOUS — per-tuk-tuk anomaly flags assigned deterministically from `deviceId`, and a movement calculator using trigonometry to advance GPS coordinates. Both `seed.js` and `simulate.js` import from this file, guaranteeing that historical and live data are generated by identical logic.

**`data/seed.js` — Initialization (run once)**

Seeds all master data and establishes the initial location dataset. The location data is recorded in burst sessions at 30-second ping intervals across development windows spanning April 16–27 2026, covering all traffic patterns and time-of-day conditions. After the first run, the historical ping call is commented out so subsequent seed runs only refresh master data.

**`data/simulate.js` — Live Simulator (run each session)**

Runs alongside the API during development and demonstration. Generates 200 pings every 30 seconds — one per registered tuk-tuk — written directly to MongoDB. On startup it loads each tuk-tuk's last known position and resumes movement from that point, so there are no teleportation artifacts between sessions. A `NODE_ENV=production` guard prevents the simulator from running on the hosted Render environment, protecting Atlas storage.

Each batch is scanned for anomalies in real time. Six anomaly types are detected and logged to the console per batch:

| Anomaly | Trigger |
|---|---|
| SPEEDING | speed > 60 km/h outside dead night |
| NIGHT\_MOVE | speed > 5 km/h between 00:00–05:00 SLT |
| BREAKDOWN | engine off for 3+ consecutive batches during daytime |
| ERRATIC | speed change > 40 km/h from previous ping |
| IDLE\_LONG | speed = 0 for 3+ consecutive batches during daytime |
| JUMP | coordinate distance impossible at reported speed |

On shutdown (Ctrl+C), the simulator prints a full session summary including duration, total pings added, and a count of each anomaly type detected during the session.

Ping volume grows dynamically with each development session. The seed provides baseline coverage from April 16–27 2026, after which the live simulator extends the dataset continuously. The database ping count at submission reflects the total accumulated across all development sessions.

---

## 5. Limitations, Scaling and Further Concerns

### 5.1 Real-Time Tracking

The current implementation uses a polling model. Clients must repeatedly call `GET /locations/live` to refresh vehicle positions. True real-time push would require WebSockets (e.g., Socket.IO) or Server-Sent Events (SSE). For a production law-enforcement system, SSE would be the preferred choice — it uses standard HTTP, is firewall-friendly, and pushes updates only when data changes, eliminating polling overhead.

### 5.2 JWT Revocation

JWT tokens cannot be invalidated before their expiry time. If a DEVICE token is compromised, or if an administrator deactivates a user account mid-session, the token remains valid until it expires. A production system should maintain a server-side token blacklist (e.g., in Redis) checked on every request, or use short-lived access tokens (5–15 minutes) paired with refresh tokens stored server-side.

### 5.3 GPS Spoofing

Location pings are trusted as submitted by the authenticated device. There is no server-side validation of coordinate plausibility beyond the Sri Lanka bounding-box check. A production system should implement movement plausibility checks — for example, rejecting a ping that implies a speed greater than 200 km/h relative to the previous ping timestamp and location.

### 5.4 Geospatial Queries

The current data model stores latitude and longitude as plain `Number` fields. MongoDB's `2dsphere` index and geospatial operators (`$nearSphere`, `$geoWithin`) are not enabled. Radius-based queries (e.g., "find all tuk-tuks within 500 m of an incident location") would require a full collection scan. A production system should migrate to a GeoJSON `Point` field type with a `2dsphere` index.

### 5.5 Scalability

The system uses a single MongoDB Atlas cluster (free tier, M0) with no read replicas. Under high concurrent load from 200+ devices pinging every 30 seconds (approximately 400 writes/min) plus multiple dashboard clients polling for live locations, the M0 cluster would become a bottleneck. A production deployment should use an M10+ cluster with read replicas routing location history queries to a secondary node, or implement a time-series collection (available in MongoDB 5.0+) optimised for append-heavy workloads.

### 5.6 Rate Limiting Granularity

The current rate limiter is applied per IP address at 100 requests per 15 minutes. This is adequate for administrative users but may be too restrictive for a burst of device pings from the same network address translation (NAT) gateway. A production system should implement per-device rate limiting using the authenticated user ID as the key, with a higher limit for DEVICE-role requests on the ping endpoint.

### 5.7 Field Projection

The `GET /tuktuks/:registrationNumber/history` endpoint supports a `?fields=` query parameter for sparse fieldsets, allowing clients to request only the fields they need (e.g. `?fields=latitude,longitude,timestamp`). The parameter is validated against a server-side whitelist to prevent information leakage. Other collection endpoints return the full resource representation; extending `?fields=` support to those endpoints would further reduce bandwidth for constrained clients.

### 5.8 Audit Logging

The system logs HTTP requests in development mode using Morgan but does not maintain a persistent audit log of sensitive administrative actions (user deactivation, tuk-tuk registration changes). A production law-enforcement system must maintain an immutable audit trail for accountability and legal admissibility.

---

## 6. Appendix — Deployment Details

### A. Deployed API URL

| Resource | URL |
|---|---|
| Base URL | https://tukpatrol-api.onrender.com |
| Health Check | https://tukpatrol-api.onrender.com/ |
| Swagger UI | https://tukpatrol-api.onrender.com/api-docs |

### B. API Specification (Swagger)

Interactive OpenAPI 3.0 documentation is available at:  
**https://tukpatrol-api.onrender.com/api-docs**

The specification covers all 8 route groups (Auth, Users, TukTuks, Location, Anomalies, Provinces, Districts, Police Stations) with full request/response schemas, authentication requirements, and example values.

**Endpoint Summary:**

| Method | Path | Role(s) | Description |
|---|---|---|---|
| POST | /api/v1/auth/login | Public | Authenticate and receive JWT |
| GET | /api/v1/auth/me | Any | Current user profile |
| GET | /api/v1/users | HQ_ADMIN | List all users (paginated) |
| POST | /api/v1/users | HQ_ADMIN | Create user |
| GET | /api/v1/users/:email | HQ_ADMIN | Get user by email |
| PATCH | /api/v1/users/:email | HQ_ADMIN | Update / deactivate user |
| GET | /api/v1/provinces | Any | List provinces |
| POST | /api/v1/provinces | HQ_ADMIN | Create province |
| GET | /api/v1/provinces/:code | Any | Get province |
| PATCH | /api/v1/provinces/:code | HQ_ADMIN | Update province |
| DELETE | /api/v1/provinces/:code | HQ_ADMIN | Delete province |
| GET | /api/v1/provinces/:code/districts | Any | List districts belonging to a province |
| GET | /api/v1/districts | Any | List districts |
| POST | /api/v1/districts | HQ_ADMIN | Create district |
| GET | /api/v1/districts/:code | Any | Get district |
| PATCH | /api/v1/districts/:code | HQ_ADMIN | Update district |
| DELETE | /api/v1/districts/:code | HQ_ADMIN | Delete district |
| GET | /api/v1/police-stations | Any | List police stations |
| POST | /api/v1/police-stations | HQ_ADMIN | Create station |
| GET | /api/v1/police-stations/:code | Any | Get station |
| PATCH | /api/v1/police-stations/:code | HQ_ADMIN | Update station |
| DELETE | /api/v1/police-stations/:code | HQ_ADMIN | Delete station |
| GET | /api/v1/tuktuks | Any | List tuk-tuks (filtered, paginated, sorted) |
| POST | /api/v1/tuktuks | HQ_ADMIN, PROVINCIAL | Register tuk-tuk |
| GET | /api/v1/tuktuks/:registrationNumber | Any | Get tuk-tuk |
| PATCH | /api/v1/tuktuks/:registrationNumber | HQ_ADMIN, PROVINCIAL | Update tuk-tuk |
| DELETE | /api/v1/tuktuks/:registrationNumber | HQ_ADMIN | Delete tuk-tuk |
| POST | /api/v1/tuktuks/:registrationNumber/ping | DEVICE | Submit location ping |
| GET | /api/v1/tuktuks/:registrationNumber/location | Any | Latest live location |
| GET | /api/v1/tuktuks/:registrationNumber/history | Any | Location history (paginated) |
| GET | /api/v1/tuktuks/:registrationNumber/summary | Any | Movement summary (distance, speed) |
| GET | /api/v1/locations/live | Any | Latest live positions of all active tuktuks (paginated, filterable) |
| GET | /api/v1/locations/history | HQ_ADMIN, PROVINCIAL, STATION | All-fleet history by time window |
| GET | /api/v1/locations/summary | Any | Fleet count by province |
| GET | /api/v1/locations/anomalies | HQ_ADMIN, PROVINCIAL, STATION | Anomalous pings across all tuktuks (threshold-based) |
| GET | /api/v1/tuktuks/:registrationNumber/anomalies | HQ_ADMIN, PROVINCIAL, STATION | Anomalous pings for a specific tuktuk |
| GET | /api/v1/locations/inactive | HQ_ADMIN, PROVINCIAL, STATION | Signal-lost vehicles |

### C. GitHub Repository

| Repository | URL |
|---|---|
| Main Repository | https://github.com/WebAPI-CW/COBSCCOMP24.2P-019 |

Student ID `COBSCCOMP24.2P-019` is included in `README.md` as required. Instructor collaborator access has been granted.

### D. AI Assistance Declaration

AI-assisted tools (GitHub Copilot, conversational AI) were used during development for the following purposes:

- Preparing initial reference data (province/district/station records)
- Drafting repetitive Swagger JSDoc annotation blocks
- Reviewing middleware implementations against RFC 7232 (ETag)
- Troubleshooting MongoDB aggregation pipeline syntax

All generated suggestions were reviewed, understood, and modified to fit the specific requirements of this project before being committed. The student is fully able to explain all design decisions, implementation details, and code at the coursework VIVA.

---

*Word count (excluding code, references, headings, and appendix tables): approximately 3,400 words.*

---

## Ethical Declaration

I, M. S. F. Shazna (NIBM ID: COBSCCOMP24.2P-019, Coventry ID: 16115859), declare that:

1. This submission is my own original work and has not been submitted, in whole or in part, for any other assessment at this or any other institution.
2. All sources consulted have been acknowledged and properly referenced in the bibliography below.
3. AI-assisted tools were used solely in the limited ways described in Appendix D of this report. All AI-generated suggestions were critically reviewed, understood, and adapted before use. I am fully able to explain every design decision and line of code at the coursework VIVA.
4. I understand that plagiarism, collusion, and the submission of AI-generated content as my own work are academic misconduct offences subject to disciplinary action under NIBM and Coventry University regulations.

**Signed:** M. S. F. Shazna  
**Date:** 29 April 2026

---

## Bibliography

Express.js contributors (2024) *Express.js API Reference — v5.x*. Available at: https://expressjs.com/en/5x/api.html (Accessed: 29 April 2026).

Fielding, R. T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. Doctoral dissertation, University of California, Irvine. Available at: https://ics.uci.edu/~fielding/pubs/dissertation/top.htm (Accessed: 29 April 2026).

Nottingham, M. and Sayre, R. (2010) *RFC 5988 — Web Linking*. Internet Engineering Task Force. Available at: https://tools.ietf.org/html/rfc5988 (Accessed: 29 April 2026).

Reschke, J. (2014) *RFC 7232 — Hypertext Transfer Protocol (HTTP/1.1): Conditional Requests*. Internet Engineering Task Force. Available at: https://tools.ietf.org/html/rfc7232 (Accessed: 29 April 2026).

MongoDB Inc. (2024) *MongoDB Manual — Aggregation Pipeline*. Available at: https://www.mongodb.com/docs/manual/core/aggregation-pipeline/ (Accessed: 29 April 2026).

Mongoose contributors (2024) *Mongoose v8.x Documentation*. Available at: https://mongoosejs.com/docs/ (Accessed: 29 April 2026).

WSO2 Inc. (2023) *WSO2 REST API Design Guidelines*. Available at: https://github.com/wso2/api-guidelines/blob/main/rest-api-guidelines/docs/restful-api-design-guidelines.md (Accessed: 29 April 2026).

JSON Web Token (2024) *JWT Introduction*. Available at: https://jwt.io/introduction (Accessed: 29 April 2026).

OWASP Foundation (2023) *OWASP Top Ten*. Available at: https://owasp.org/www-project-top-ten/ (Accessed: 29 April 2026).

Vitest contributors (2024) *Vitest Documentation*. Available at: https://vitest.dev/ (Accessed: 29 April 2026).
