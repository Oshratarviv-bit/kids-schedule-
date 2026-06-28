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

// Register
app.post('/api/register', (req, res) => {
  const { phone, firstName, lastName, role, children } = req.body;
  if (!phone || !firstName || !lastName) return res.json({ ok: false, msg: 'נא למלא את כל השדות' });
  const db = readDB();
  if (db.users.find(u => u.phone === phone)) return res.json({ ok: false, msg: 'מספר טלפון כבר רשום' });
  const user = { phone, firstName, lastName, role, children: children || [], password: req.body.password };
  db.users.push(user);
  db.schedules['child_' + phone] = [];
  writeDB(db);
  res.json({ ok: true, user: { phone, firstName, lastName, role, children: children || [] } });
});

// Login
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.phone === phone && u.password === password);
  if (!user) return res.json({ ok: false, msg: 'מספר טלפון או סיסמה שגויים' });
  res.json({ ok: true, user: { phone: user.phone, firstName: user.firstName, lastName: user.lastName, role: user.role, children: user.children || [] } });
});

// Get schedule
app.get('/api/schedule/:key', (req, res) => {
  const db = readDB();
  res.json(db.schedules[req.params.key] || []);
});

// Save schedule
app.post('/api/schedule/:key', (req, res) => {
  const db = readDB();
  db.schedules[req.params.key] = req.body;
  writeDB(db);
  res.json({ ok: true });
});

// Mark event done
app.post('/api/done/:key/:eventId', (req, res) => {
  const db = readDB();
  const evs = db.schedules[req.params.key] || [];
  const ev = evs.find(e => e.id == req.params.eventId);
  if (ev) ev.done = req.body.done;
  db.schedules[req.params.key] = evs;
  writeDB(db);
  res.json({ ok: true });
});

// Share link
app.post('/api/share', (req, res) => {
  const { scheduleKey, ownerName } = req.body;
  const db = readDB();
  const code = Math.random().toString(36).substr(2, 8).toUpperCase();
  db.sharedLinks[code] = { scheduleKey, ownerName, createdAt: Date.now() };
  writeDB(db);
  res.json({ ok: true, code });
});

app.get('/api/share/:code', (req, res) => {
  const db = readDB();
  const link = db.sharedLinks[req.params.code];
  if (!link) return res.json({ ok: false, msg: 'קישור לא תקין' });
  res.json({ ok: true, events: db.schedules[link.scheduleKey] || [], ownerName: link.ownerName });
});

// Get user by phone (for parent to find child)
app.get('/api/user/:phone', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.phone === req.params.phone);
  if (!user) return res.json({ ok: false });
  res.json({ ok: true, name: user.firstName + ' ' + user.lastName });
});

app.listen(process.env.PORT || 3000, () => console.log('Running'));
