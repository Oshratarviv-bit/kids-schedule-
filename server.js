const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const DB = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({ users: [], schedules: {}, sharedLinks: {} }));
  const data = JSON.parse(fs.readFileSync(DB));
  if (!data.sharedLinks) data.sharedLinks = {};
  return data;
}
function writeDB(data) { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

app.post('/api/register', (req, res) => {
  const { username, password, role, children } = req.body;
  const db = readDB();
  if (db.users.find(u => u.username === username))
    return res.json({ ok: false, msg: 'שם משתמש כבר קיים' });
  db.users.push({ username, password, role, children: children || [] });
  db.schedules[username] = [];
  writeDB(db);
  res.json({ ok: true, user: { username, role, children: children || [] } });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.json({ ok: false, msg: 'שם משתמש או סיסמה שגויים' });
  res.json({ ok: true, user: { username: user.username, role: user.role, children: user.children || [] } });
});

app.get('/api/schedule/:key', (req, res) => {
  const db = readDB();
  res.json(db.schedules[req.params.key] || []);
});

app.post('/api/schedule/:key', (req, res) => {
  const db = readDB();
  db.schedules[req.params.key] = req.body;
  writeDB(db);
  res.json({ ok: true });
});

// Create share link
app.post('/api/share', (req, res) => {
  const { scheduleKey, ownerName } = req.body;
  const db = readDB();
  const code = Math.random().toString(36).substr(2, 8).toUpperCase();
  db.sharedLinks[code] = { scheduleKey, ownerName, createdAt: Date.now() };
  writeDB(db);
  res.json({ ok: true, code });
});

// Get shared schedule by code
app.get('/api/share/:code', (req, res) => {
  const db = readDB();
  const link = db.sharedLinks[req.params.code];
  if (!link) return res.json({ ok: false, msg: 'קישור לא תקין' });
  const events = db.schedules[link.scheduleKey] || [];
  res.json({ ok: true, events, ownerName: link.ownerName });
});

app.listen(process.env.PORT || 3000, () => console.log('Running'));
