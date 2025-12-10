import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export default function App() {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  function showMsg(msg) {
    setMessage(msg);
    setTimeout(()=>setMessage(null), 4000);
  }
  function showErr(e) {
    setError(e);
    setTimeout(()=>setError(null), 5000);
  }

  async function fetchFiles() {
    try {
      const res = await fetch(API_BASE + '/documents');
      if(!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      showErr(err.message || 'Error fetching files');
    }
  }

  async function onFileChange(e) {
    const f = e.target.files[0];
    if(!f) return;
    if(f.type !== 'application/pdf') {
      showErr('Only PDF files allowed');
      return;
    }
    const form = new FormData();
    form.append('file', f);
    setUploading(true);
    try {
      const res = await fetch(API_BASE + '/documents/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      showMsg('Upload successful');
      fetchFiles();
    } catch (err) {
      showErr(err.message || 'Upload error');
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  }

  function onDownload(id, filename) {
    // create link to download endpoint
    const url = API_BASE + '/documents/' + id;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function onDelete(id) {
    if(!confirm('Delete this file?')) return;
    try {
      const res = await fetch(API_BASE + '/documents/' + id, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      showMsg('Deleted');
      fetchFiles();
    } catch (err) {
      showErr(err.message || 'Delete error');
    }
  }

  return (
    <div className="app-root">
      <div className="card">
        <h1>PDF Uploader</h1>

        <label className="upload-area">
          <input type="file" accept="application/pdf" onChange={onFileChange} disabled={uploading} />
          <div className="upload-text">{uploading ? 'Uploading...' : 'Choose a PDF to upload'}</div>
        </label>

        <div className="status-row">
          {message && <div className="success">{message}</div>}
          {error && <div className="error">{error}</div>}
        </div>

        <h2>Uploaded files</h2>
        {files.length === 0 ? (
          <div className="empty">No files uploaded yet.</div>
        ) : (
          <ul className="file-list">
            {files.map(f => (
              <li key={f.id} className="file-item">
                <div className="file-meta">
                  <strong>{f.filename}</strong>
                  <div className="muted">{new Date(f.created_at).toLocaleString()} • {formatBytes(f.filesize)}</div>
                </div>
                <div className="file-actions">
                  <button onClick={() => onDownload(f.id, f.filename)}>Download</button>
                  <button className="danger" onClick={() => onDelete(f.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="foot">Backend: {API_BASE} • Files stored on server uploads/</footer>
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
