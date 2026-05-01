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

1. Frontend requests `POST /uploads/presign`.
2. Backend validates metadata and creates DB record with `pending` status.
3. Backend returns pre-signed S3 `PUT` URL.
4. Frontend uploads file directly to S3.
5. S3 emits event to SQS queue.
6. Backend SQS listener downloads file, extracts text, indexes to OpenSearch.
7. Backend updates DB status and publishes SSE events.

## Repository Structure

- `backend/` - NestJS API and SQS worker/listener
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

### Important backend env notes

- For local Docker Postgres mapping, `POSTGRES_PORT` may be `5433` if host port is remapped.
- For Docker Compose service-to-service networking (EC2 compose), use:
  - `POSTGRES_HOST=postgres`
  - `POSTGRES_PORT=5432`
- If you use a fresh DB without migrations, set `DB_SYNCHRONIZE=true` temporarily so TypeORM creates tables.

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

- `GET /aws/health`
- `POST /uploads/presign`
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
