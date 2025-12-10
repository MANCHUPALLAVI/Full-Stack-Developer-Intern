const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 4000;
app.use(cors());

// SQLite setup
const db = new sqlite3.Database('./files.db', (err) => {
  if(err) console.error(err);
  else console.log('SQLite connected');
});

db.run(`CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  filepath TEXT,
  filesize INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Upload folder
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if(!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // max 10MB

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if(!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { originalname, filename, size } = req.file;
  db.run(`INSERT INTO documents (filename, filepath, filesize) VALUES (?, ?, ?)`,
    [originalname, filename, size],
    function(err){
      if(err) return res.status(500).json({ error: 'DB insert failed' });
      res.json({ id: this.lastID });
    });
});

// List all files
app.get('/api/documents', (req, res) => {
  db.all(`SELECT id, filename, filesize, created_at FROM documents ORDER BY created_at DESC`, [], (err, rows) => {
    if(err) return res.status(500).json({ error: 'DB fetch failed' });
    res.json(rows);
  });
});

// Download file
app.get('/api/documents/:id/download', (req, res) => {
  db.get(`SELECT * FROM documents WHERE id = ?`, [req.params.id], (err, row) => {
    if(err || !row) return res.status(404).send('File not found');
    const filePath = path.join(UPLOAD_DIR, row.filepath);
    res.download(filePath, row.filename);
  });
});

// Delete file
app.delete('/api/documents/:id', (req, res) => {
  db.get(`SELECT * FROM documents WHERE id = ?`, [req.params.id], (err, row) => {
    if(err || !row) return res.status(404).json({ error: 'File not found' });
    const filePath = path.join(UPLOAD_DIR, row.filepath);
    fs.unlink(filePath, (err) => {
      if(err) return res.status(500).json({ error: 'File delete failed' });
      db.run(`DELETE FROM documents WHERE id = ?`, [req.params.id], (err) => {
        if(err) return res.status(500).json({ error: 'DB delete failed' });
        res.json({ success: true });
      });
    });
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
