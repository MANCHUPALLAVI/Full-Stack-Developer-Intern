# Design Document — PDF Patient Documents Portal

## Tech stack choices
1. Frontend: **React (Create React App)** — fast to build interactive UI and widely known.
2. Backend: **Node.js + Express** — lightweight, easy to implement REST APIs and file handling.
3. Database: **SQLite** — simple file-based DB for local development and assessments.

### Why these?
- Rapid development, low ops overhead, minimal setup for evaluators.
- SQLite stores metadata without extra infra; Express handles file upload with multer.

# Design Document
## Architecture overview
Frontend (React) ↔ Backend (Express REST API) ↔ SQLite (documents.db)
Files stored in `backend/uploads/`.
- Single server backend (Node.js + Express) serving a REST API.
- SQLite database for metadata (`documents` table).
- Local filesystem storage for uploaded files under `uploads/`.
- Frontend is a simple single-page app (vanilla HTML/JS) that interacts with the backend.

## Data Flow
- Upload:
  1. Frontend sends multipart/form-data to `/documents/upload`.
  2. Backend saves file to `uploads/` and inserts metadata into SQLite.
  3. Backend returns ID.
- Download:
  1. Frontend navigates to `/documents/:id`.
  2. Backend finds metadata, streams file using `res.download()`.

## Stack choices
- Backend: Node.js + Express — lightweight, widely used, easy file handling.
- Database: SQLite (better-sqlite3) — simple, file-based, no external DB server needed.
- Frontend: Vanilla HTML + Fetch API — minimal dependencies and easy to run.
- File storage: local filesystem `backend/uploads/`.

## API Spec
### POST /api/upload
- Description: Upload a PDF file.
- Request: multipart/form-data with field `file`.
- Validation: Only accept `application/pdf`; max file size 10 MB.
- Response:
  - 201 Created: `{ "id", "filename", "filesize", "created_at" }`
  - 400 Bad Request: validation error.

### GET /api/documents
- Description: List all uploaded documents metadata.
- Response: 200 OK: `[{ id, filename, filepath, filesize, created_at }, ...]`

### GET /api/documents/:id/download
- Description: Download a file by id.
- Response: 200 file stream or 404 if not found.

### DELETE /api/documents/:id
- Description: Delete metadata + file.
- Response: 200 `{ "deleted": true }` or 404 if not found.

## Database schema
Table `documents`:
- id INTEGER PRIMARY KEY AUTOINCREMENT
- filename TEXT NOT NULL
- filepath TEXT NOT NULL
- filesize INTEGER NOT NULL
- created_at TEXT NOT NULL

## Assumptions
- Single-instance deployment (no S3).
- No authentication (demo).
- Max file size 10 MB.
- Single user (no auth).
- Max file size 20MB.
- Only PDFs allowed.
- Local deployment for assessment purposes.

## Scaling considerations (1,000 users)
- Move files to cloud object store (S3).
- Migrate metadata to PostgreSQL.
- Add user auth and per-user isolation.
- Serve uploads via pre-signed URLs or CDN.
- Add background workers for virus scanning and processing.




