const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const db = new Database(path.join(__dirname, 'data.db'));
db.exec(`
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  filesize INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype !== 'application/pdf')
      return cb(new Error('Only PDF files are allowed'));
    cb(null, true);
  }
});

// ROUTES
app.post('/api/upload', upload.single('file'), (req, res) => {
  const stmt = db.prepare(`
    INSERT INTO documents (filename, filepath, filesize, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const info = stmt.run(
    req.file.originalname,
    req.file.filename,
    req.file.size,
    new Date().toISOString()
  );

  res.json({ message: 'Uploaded successfully', id: info.lastInsertRowid });
});

app.get('/api/documents', (req, res) => {
  const rows = db.prepare('SELECT * FROM documents ORDER BY id DESC').all();
  res.json(rows);
});

app.get('/api/documents/:id/download', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(UPLOAD_DIR, row.filepath);
  res.download(filePath, row.filename);
});

app.delete('/api/documents/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(UPLOAD_DIR, row.filepath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM documents WHERE id=?').run(req.params.id);

  res.json({ deleted: true });
});

// ERROR HANDLER — MUST BE LAST
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// START SERVER
app.listen(4000, () => console.log('Server running on port 4000'));
