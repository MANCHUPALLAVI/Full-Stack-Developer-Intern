const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const dbFile = path.join(__dirname, 'documents.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT,
    filepath TEXT,
    filesize INTEGER,
    created_at TEXT
  )`);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2,9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\- _]/g, '_');
    cb(null, unique + '-' + safe);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

const app = express();
app.use(cors());
app.use(express.json());

// Upload endpoint
app.post('/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded or wrong file type.' });
  const id = path.basename(req.file.filename); // use stored filename as id
  const stmt = db.prepare('INSERT INTO documents (id, filename, filepath, filesize, created_at) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, req.file.originalname, req.file.filename, req.file.size, new Date().toISOString(), function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ id });
  });
});

// List documents
app.get('/documents', (req, res) => {
  db.all('SELECT id, filename, filesize, created_at FROM documents ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// Download by id
app.get('/documents/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(UPLOAD_DIR, row.filepath);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });
    res.download(filePath, row.filename);
  });
});

// Delete
app.delete('/documents/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM documents WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(UPLOAD_DIR, row.filepath);
    fs.unlink(filePath, (fsErr) => {
      if (fsErr && fsErr.code !== 'ENOENT') {
        console.error(fsErr);
        return res.status(500).json({ error: 'Failed to delete file' });
      }
      db.run('DELETE FROM documents WHERE id = ?', [id], function(dbErr) {
        if (dbErr) {
          console.error(dbErr);
          return res.status(500).json({ error: 'DB delete error' });
        }
        res.json({ success: true });
      });
    });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
