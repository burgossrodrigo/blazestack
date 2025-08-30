# BlazeStack API

Rust (Warp) API for creating and reading **Incidents**, using **Redis** as a write‑through cache.
Architecture: **Clean / Hexagonal (Ports & Adapters)** — HTTP handlers (infra) → use cases (domain) → cache port → Redis adapter.

---

## Requirements

- Rust (stable)
- Docker + Docker Compose
- Open ports: **3030** (API) and **6379** (Redis)

---

## Project Structure

```
blazestack/
  docker-compose.yml
  .env
  api/
    Cargo.toml
    src/
      main.rs
      lib.rs
      domain/...
      infra/...
    Dockerfile
```

> The API binds to `0.0.0.0:3030` (container-friendly).

---

## Environment Variables

**Required**

- `REDIS_URL` — Redis connection string

Examples:
- In Compose (service named `redis`):
  `redis://default:${REDIS_PASSWORD}@redis:6379`
- From host to local Redis:
  `redis://default:supersecret@127.0.0.1:6379`

**Optional**

- `RUST_LOG` (e.g., `info,warp=info`)

---

## Quick Start (Docker Compose)

1) Create `.env` at repo root:
```bash
echo "REDIS_PASSWORD=supersecret" > .env
```

2) `docker-compose.yml` (at repo root):
```yaml
services:
  redis:
    image: redis:7-alpine
    command: >
      sh -c "redis-server --appendonly yes --requirepass $$REDIS_PASSWORD"
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD:-changeme}
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD-SHELL", "redis-cli -a $$REDIS_PASSWORD ping | grep PONG"]
      interval: 5s
      timeout: 3s
      retries: 20
    restart: unless-stopped

  api:
    build:
      context: ./api            # looks for ./api/Dockerfile
      dockerfile: Dockerfile
    environment:
      REDIS_URL: redis://default:${REDIS_PASSWORD}@redis:6379
      RUST_LOG: info,warp=info
    depends_on:
      redis:
        condition: service_healthy
    ports:
      - "3030:3030"
    restart: unless-stopped

volumes:
  redis-data:
```

3) Build & start:
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f api
```

You should see the server listening on `0.0.0.0:3030`.

---

## Local Development (cargo) + Redis via Compose

1) Start only Redis:
```bash
docker compose up -d redis
```

2) Export env and run the API:
```bash
export REDIS_URL="redis://default:${REDIS_PASSWORD}@127.0.0.1:6379"
export RUST_LOG="info,warp=info"

cd api
cargo run
```

---

## API Endpoints

### POST `/incidents`

Create an incident and write‑through to Redis.

**Body** (`snake_case`):
```json
{
  "title": "Test",
  "incident_type": "fire",   // "fire" | "flood" | "earthquake"
  "description": "optional...",
  "location": "optional...",
  "image": null
}
```

**Response** `201 Created`:
```json
{ "incident": { ... } }
```

### GET `/incidents?prefix=&limit=`

List incidents from Redis.

**Response**:
```json
{
  "items": [
    { "key": "test", "incident": { ... } }
  ]
}
```

### GET `/incidents/{key}`

Fetch a single incident by key.
(Default key: `title.to_lowercase()` used by the server when caching.)

### GET `/healthz`

Simple liveness probe. Returns `200 OK` with `"ok"`.

---

## cURL Examples

Create:
```bash
curl -X POST http://localhost:3030/incidents   -H 'Content-Type: application/json'   -d '{
    "title":"Test",
    "incident_type":"fire",
    "description":"smoke in server room",
    "location":"rack A-3",
    "image": null
  }'
```

List:
```bash
curl "http://localhost:3030/incidents?prefix=&limit=50"
```

Get one:
```bash
curl http://localhost:3030/incidents/test
```

Health:
```bash
curl http://localhost:3030/healthz
```

---

## Troubleshooting

- **Empty reply from server**
  Usually a panic or unhandled rejection. Ensure your routes are combined with a global `.recover(...)` and check logs:
  ```bash
  docker compose logs -f api
  ```

- **deadpool_redis: UrlAndConnectionSpecified**
  Build the pool from URL only:
  ```rust
  let pool = deadpool_redis::Config::from_url(std::env::var("REDIS_URL")?)
      .create_pool(Some(deadpool_redis::Runtime::Tokio1))?;
  ```

- **Cannot connect from host**
  Ensure the server binds to all interfaces:
  ```rust
  warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
  ```

- **Enum values**
  JSON must be snake_case: `"fire" | "flood" | "earthquake"`.

---

## .gitignore (root suggestion)

```
**/target
node_modules
.DS_Store
```
