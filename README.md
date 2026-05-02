# AWS Nest + React Document Upload App

Full-stack app for uploading `.pdf`/`.docx` documents to AWS S3, processing them asynchronously via SQS, indexing content into AWS OpenSearch, and searching with highlights.

## Stack

- Backend: NestJS, TypeORM, PostgreSQL
- Frontend: React (Vite), React Query, React Hook Form, Zod
- AWS: S3 (storage), SQS (queue), OpenSearch (search index)
- Live updates: Server-Sent Events (SSE)
- Deploy: Frontend on Vercel, Backend on EC2 (self-hosted GitHub Actions runner + Docker Compose)

## Features

- Email-based auth emulation (saved in browser localStorage)
- One-file-at-a-time upload
- File validation: only `.pdf` and `.docx`, max 10 MB
- Direct browser upload to S3 via pre-signed URL
- Async worker flow: S3 event -> SQS -> backend listener -> parse -> OpenSearch index
- Document statuses: `pending` -> `processing` -> `success` / `error`
- Live status updates per user via SSE (`/events/stream`)
- List documents by user
- Search documents with OpenSearch fuzziness + highlight snippets
- Delete document from DB, S3, and OpenSearch

## Architecture Flow

1. Frontend calls `POST /documents/pending` — validates metadata, reserves an S3 key, creates a DB row with `pending` status, notifies SSE.
2. Frontend calls `POST /documents/:id/presign?userEmail=...` — domain auth + returns a generic S3 presigned `PUT` URL (signing lives in `S3PresignService`, no upload logic mixed in).
3. Frontend uploads the file directly to S3 with that URL.
4. S3 emits an event to SQS.
5. Backend SQS listener downloads the object, parses text, indexes OpenSearch.
6. Backend updates DB status and publishes SSE events.

## Repository Structure

- `backend/` - NestJS API and SQS worker/listener
  - `src/common/aws/` - AWS integration: `types/index.ts` (shared types), `s3/s3.service.ts` (S3 client + presign), `opensearch/`, `sqs/` (listener + client), `aws.module.ts`
- `frontend/` - React app (Vite)
- `.github/workflows/` - CI/CD workflows

## Prerequisites

- Node.js 22+
- npm
- Docker + Docker Compose
- AWS account with S3, SQS, OpenSearch configured

## Backend Setup (Local)

1. Install dependencies:
   - `cd backend`
   - `npm ci`
2. Create env file:
   - copy `backend/.env.example` to `backend/.env`
3. Set required env values (Postgres + AWS).
4. Start backend:
   - `npm run start:dev`

On boot, `ConfigModule` runs a **Joi schema** (`src/config/env.validation.ts`) so missing or invalid environment variables fail fast. See [NestJS configuration — schema validation](https://docs.nestjs.com/techniques/configuration#schema-validation).

### Important backend env notes

- For local Docker Postgres mapping, `POSTGRES_PORT` may be `5433` if host port is remapped.
- For Docker Compose service-to-service networking (EC2 compose), use:
  - `POSTGRES_HOST=postgres`
  - `POSTGRES_PORT=5432`
- If you use a fresh DB without migrations, set `DB_SYNCHRONIZE=true` temporarily so TypeORM creates tables.
- Set `API_KEY` for production so `GET /aws/health` is not publicly callable without the key.

## Frontend Setup (Local)

1. Install dependencies:
   - `cd frontend`
   - `npm ci`
2. Create env file:
   - copy `frontend/.env.example` to `frontend/.env` (or create it)
3. Set:
   - `VITE_API_BASE_URL=http://localhost:3000`
4. Start frontend:
   - `npm run dev`

## AWS Configuration Checklist

- S3 bucket created (for documents)
- SQS queue created
- S3 event notification configured to send `ObjectCreated` events to SQS
- OpenSearch domain created and reachable by backend credentials
- IAM user/role has required permissions for S3, SQS, OpenSearch

### S3 CORS (required for browser upload)

Set bucket CORS to allow your frontend origin to `PUT` files via pre-signed URLs.

Example:

```json
[
  {
    "AllowedOrigins": ["https://your-frontend-domain"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Deployment

### Frontend (Vercel)

Workflow: `.github/workflows/frontend-vercel-deploy.yml`

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Required Vercel env:

- `VITE_API_BASE_URL=https://your-api-domain`

### Backend (EC2 self-hosted runner)

Workflow: `.github/workflows/backend-ec2-selfhosted-deploy.yml`

Required GitHub secret:

- `BACKEND_ENV_FILE` (full multi-line content of `backend/.env`)

Compose file used in deploy:

- `backend/docker-compose.ec2.yml`

## Useful API Endpoints

- `GET /aws/health` — protected in production: set `API_KEY` in `backend/.env` and send `X-Api-Key: <key>`. If `API_KEY` is unset, the route is open only when `NODE_ENV` is not `production` (for local dev).
- `POST /documents/pending`
- `POST /documents/:id/presign?userEmail=...`
- `GET /documents?userEmail=...`
- `GET /documents/search?userEmail=...&q=...`
- `DELETE /documents/:id?userEmail=...`
- `GET /events/stream?email=...` (SSE)

## Troubleshooting

- `500 relation "documents" does not exist`
  - DB is empty and schema not created. Enable `DB_SYNCHRONIZE=true` temporarily or run migrations.
- `ECONNREFUSED ...:5433` from backend in Docker
  - Wrong DB port inside container network. Use `POSTGRES_PORT=5432`.
- S3 upload CORS error in browser
  - Configure S3 bucket CORS to include frontend origin and `PUT`.
- Frontend calls wrong API URL
  - Verify `VITE_API_BASE_URL` in Vercel Production env and create a new deployment.

## Security Notes

- Do not commit secrets to git.
- Rotate AWS access keys immediately if they were exposed.
- Prefer IAM roles on EC2 over long-lived access keys when possible.
