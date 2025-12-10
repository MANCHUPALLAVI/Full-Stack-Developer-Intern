# Full-Stack PDF Uploader (Assessment)

This repository contains a simple full-stack app that allows uploading, listing,
downloading and deleting PDF files. Designed for local use (assessment).

## Project overview
A minimal full-stack app to upload PDF files, list uploaded documents, download and delete them.
- Backend: Node.js + Express + SQLite (better-sqlite3)
- Frontend: single-page HTML + JavaScript (Fetch API)
- Files stored locally under `backend/uploads/`

## Structure
- /frontend — React frontend (Create React App)
- /backend — Node + Express backend using sqlite3 and multer
- /design.md — design and answers
- README explains how to run.

## How to run locally

Install dependencies:

npm install express multer sqlite3 cors

Run backend:

node server.js

Open index.html in your browser.

### Prerequisites
- Node.js (v16+)
- npm

### Backend
1. Open terminal in `backend/`
2. Install dependencies:
```bash
npm install
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



