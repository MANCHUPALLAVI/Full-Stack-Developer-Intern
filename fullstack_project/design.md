# Design Document — PDF Patient Documents Portal

## Tech stack choices
1. Frontend: **React (Create React App)** — fast to build interactive UI and widely known.
2. Backend: **Node.js + Express** — lightweight, easy to implement REST APIs and file handling.
3. Database: **SQLite** — simple file-based DB for local development and assessments.

### Why these?
- Rapid development, low ops overhead, minimal setup for evaluators.
- SQLite stores metadata without extra infra; Express handles file upload with multer.

## Architecture overview
Frontend (React) ↔ Backend (Express REST API) ↔ SQLite (documents.db)
Files stored in `backend/uploads/`.

## API Spec
1. `POST /documents/upload`
   - Upload form field: `file` (PDF)
   - Response: `{ id: "<id>" }` or `{ error: "..." }`
2. `GET /documents`
   - Returns: `[{ id, filename, filesize, created_at }, ...]`
3. `GET /documents/:id`
   - Downloads the file as attachment.
4. `DELETE /documents/:id`
   - Deletes file and metadata. Returns `{ success: true }`.

## Data Flow
- Upload:
  1. Frontend sends multipart/form-data to `/documents/upload`.
  2. Backend saves file to `uploads/` and inserts metadata into SQLite.
  3. Backend returns ID.
- Download:
  1. Frontend navigates to `/documents/:id`.
  2. Backend finds metadata, streams file using `res.download()`.

## Assumptions
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
