# Collaborative Task & Scheduling Platform

A production-grade, multi-tenant SaaS Collaborative Task & Scheduling Platform built with NestJS, PostgreSQL, TypeORM, Redis, BullMQ, and Socket.IO.

---

## Architecture Blueprint

```mermaid
graph TD
    Client[Web / Desktop Clients] -->|WS / HTTPS| Gateway[NestJS API Gateway]
    Gateway -->|Cache Aside| RedisCache[(Redis Cache)]
    Gateway -->|Read/Write| Postgres[(PostgreSQL DB)]
    Gateway -->|Enqueue Jobs| BullMQ[BullMQ Queues]
    
    Sub-Graph Background Services
        Scheduler[NestJS Scheduler] -->|Cron Checks| BullMQ
        BullMQ -->|De-queue Jobs| Worker[Background Workers]
        Worker -->|Persist Logs| Postgres
        Worker -->|WS Event Push| Gateway
        Worker -->|Mock Send| EmailService[Email Delivery]
    end
```

---

## Primary Technology Stack

* **Core Framework**: NestJS (TypeScript)
* **Database & Persistence**: PostgreSQL (TypeORM) with Recursive CTEs, soft deletes, and optimistic locking (`@VersionColumn`)
* **Caching Layer**: Redis (ioredis) with Pattern-based Invalidation
* **Job Queues**: BullMQ (Redis-backed async processing)
* **Realtime Communication**: Socket.IO with Redis Adapter for horizontal scaling
* **Monitoring & Metrics**: Prometheus (prom-client) & Grafana
* **Documentation**: Swagger/OpenAPI UI

---

## Core Infrastructure Services

### 1. Tenancy & Access Control
* **Workspace Isolation**: Workspace-scoped routers (`/workspaces/:workspaceId/...`) enforce tenant boundaries.
* **RBAC & Guards**: Enforces Role-based checks (`RoleGuard`) and fine-grained action checks (`PermissionGuard`) using decorators.

### 2. Recursive Task Hierarchy
* **CTE Subtasks**: Traverses task dependencies and trees of subtasks using `WITH RECURSIVE` queries in a single database roundtrip.
* **Optimistic Locking**: Enforces task updates safely using standard TypeORM transaction checks.

### 3. Background Workers
* **Notification Worker**: Dispatches push notifications.
* **Email Worker**: Processes user registrations, verifications, and due alerts.
* **Reminder Worker**: Translates task due milestones into in-app websocket events.
* **Activity & Audit Workers**: Offloads database tracking logic from the main application thread to the background.

---

## Monitoring & Observability

The platform exposes dedicated endpoints for health monitoring and metrics collection:

### Health Checks
* **Endpoint**: `GET /api/v1/health`
* Returns status of PostgreSQL and Redis connections:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  },
  "timestamp": "2026-06-15T06:33:01.000Z"
}
```
* **DB check**: `GET /api/v1/health/db`
* **Redis check**: `GET /api/v1/health/redis`

### Prometheus Metrics
* **Endpoint**: `GET /api/v1/metrics`
* Formatted in standard Prometheus scraper payload format. Emits:
  - Default Node.js system metrics (CPU, Memory, Garbage Collection)
  - `nest_http_requests_total`: HTTP request counters labeled by `method`, `route`, and `status`.
  - `nest_http_request_duration_seconds`: Request latency histogram.
  - `nest_db_query_duration_seconds`: Database latency checks.
  - `nest_redis_op_duration_seconds`: Redis performance stats.
  - `nest_queue_jobs_total`: Count of background jobs processed.

---

## Local Development & Installation

### Prerequisites
* **Node.js**: v20 or higher
* **Docker & Docker Compose**

### Running with Docker Compose
To boot the entire ecosystem (Postgres, Redis, MinIO, Prometheus, Grafana, API):
```bash
docker-compose up --build
```
* **API Server**: `http://localhost:3000/api/v1`
* **Swagger Documentation**: `http://localhost:3000/docs`
* **MinIO Console**: `http://localhost:9001`
* **Prometheus UI**: `http://localhost:9090`
* **Grafana Dashboard**: `http://localhost:3001`

### Running Locally
1. Clone the repository and install dependencies:
```bash
npm install
```
2. Configure `.env` or use default credentials pointing to local services.
3. Start the NestJS application in watch mode:
```bash
npm run start:dev
```

---

## Testing & Quality Control

### Running Tests
To run Jest unit tests:
```bash
npm run test
```
To run integration tests:
```bash
npm run test:e2e
```

### CI/CD
GitHub Actions workflow configurations are located under `.github/workflows/ci.yml`. The pipeline automatically:
1. Runs code quality checks (`npm run lint`).
2. Executes the entire test suite (`npm run test`).
3. Verifies compilation and production builds (`npm run build`).

---

## License
MIT
