# Full-Stack PDF Uploader (Assessment)

This repository contains a simple full-stack app that allows uploading, listing,
downloading and deleting PDF files. Designed for local use (assessment).

## Structure
- /frontend — React frontend (Create React App)
- /backend — Node + Express backend using sqlite3 and multer
- /design.md — design and answers
- README explains how to run.

## How to run locally

### Backend
```bash
cd backend
npm install
npm start
```
Server will run on http://localhost:4000

### Frontend
```bash
cd frontend
npm install
npm start
```
Frontend will run on http://localhost:3000 and calls backend at http://localhost:4000 by default.

## Notes
- Uploaded files are stored in `backend/uploads/`.
- Metadata stored in `backend/documents.db` (SQLite).
