const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const DB_PATH = path.join(os.tmpdir(), 'ekart.db');
const SCHEMA_PATH = path.join(__dirname, '../../data/schema.sql');
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ekart-admin-secret-2024';

let db = null;

function getDb() {
  if (db) {
    try { db.prepare('SELECT 1').get(); return db; }
    catch { db = null; }
  }
  if (fs.existsSync(DB_PATH)) {
    db = new DatabaseSync(DB_PATH);
  } else {
    db = new DatabaseSync(DB_PATH);
    db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }
  db.exec('PRAGMA journal_mode=WAL');
  return db;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken(username) {
  const payload = `${username}:${Date.now()}`;
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64');
}

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return null;
    const signature = parts.pop();
    const payload = parts.join(':');
    const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
    if (signature !== expected) return null;
    const ts = parseInt(parts[parts.length - 1]);
    if (Date.now() - ts > 86400000) return null;
    return parts.slice(0, -1).join(':');
  } catch {
    return null;
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body, (k, v) => typeof v === 'bigint' ? Number(v) : v),
  };
}

function getBody(event) {
  try { return JSON.parse(event.body || '{}'); }
  catch { return null; }
}

function requireAuth(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const token = auth.replace('Bearer ', '');
  const username = verifyToken(token);
  if (!username) {
    return null;
  }
  return username;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const d = getDb();
    let p = event.path.replace(/^\/api\/admin/, '').replace(/^\/\.netlify\/functions\/admin/, '');
    if (p.startsWith('/')) p = p.slice(1);
    const segments = p.split('/').filter(Boolean);

    if (event.httpMethod === 'POST' && segments[0] === 'login') {
      const body = getBody(event);
      if (!body || !body.username || !body.password) {
        return json({ error: 'Username and password required' }, 400);
      }
      const row = d.prepare('SELECT password_hash FROM admin_users WHERE username = ?').get(body.username);
      if (!row || row.password_hash !== hashPassword(body.password)) {
        return json({ error: 'Invalid credentials' }, 401);
      }
      return json({ success: true, token: createToken(body.username), username: body.username });
    }

    const username = requireAuth(event);
    if (!username) return json({ error: 'Unauthorized' }, 401);

    if (event.httpMethod === 'GET' && segments[0] === 'lr') {
      if (segments[1]) {
        const entry = d.prepare('SELECT * FROM lr_entries WHERE id = ?').get(parseInt(segments[1]));
        if (!entry) return json({ error: 'Not found' }, 404);
        const updates = d.prepare('SELECT * FROM tracking_updates WHERE lr_number = ? ORDER BY timestamp ASC').all(entry.lr_number);
        return json({ consignment: entry, tracking_updates: updates });
      }
      const entries = d.prepare('SELECT * FROM lr_entries ORDER BY created_at DESC').all();
      return json({ consignments: entries });
    }

    if (event.httpMethod === 'POST' && segments[0] === 'lr' && !segments[1]) {
      const body = getBody(event);
      if (!body || !body.origin || !body.destination) {
        return json({ error: 'Origin and destination are required' }, 400);
      }

      const countRow = d.prepare('SELECT COUNT(*) as cnt FROM lr_entries').get();
      const count = (countRow.cnt || 0) + 1;
      const lr_number = `EKT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

      d.prepare(`INSERT INTO lr_entries 
        (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, 
         origin, destination, package_desc, weight, status, current_location, estimated_delivery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        lr_number,
        body.sender_name || '',
        body.sender_address || '',
        body.sender_phone || '',
        body.receiver_name || '',
        body.receiver_address || '',
        body.receiver_phone || '',
        body.origin,
        body.destination,
        body.package_desc || '',
        body.weight || '',
        body.status || 'Booked',
        body.current_location || body.origin,
        body.estimated_delivery || '',
      );

      d.prepare(`INSERT INTO tracking_updates (lr_number, location, status, description)
        VALUES (?, ?, ?, ?)`).run(lr_number, body.origin, 'Booked', `Shipment booked at ${body.origin}`);

      const entry = d.prepare('SELECT * FROM lr_entries WHERE lr_number = ?').get(lr_number);
      return json({ success: true, consignment: entry }, 201);
    }

    if (event.httpMethod === 'PUT' && segments[0] === 'lr' && segments[1]) {
      const body = getBody(event);
      if (!body) return json({ error: 'Invalid body' }, 400);

      const sets = [];
      const vals = [];
      const updatable = ['sender_name', 'sender_address', 'sender_phone', 'receiver_name', 'receiver_address', 'receiver_phone', 'origin', 'destination', 'package_desc', 'weight', 'status', 'current_location', 'estimated_delivery'];

      for (const f of updatable) {
        if (body[f] !== undefined) {
          sets.push(`${f} = ?`);
          vals.push(body[f]);
        }
      }
      if (sets.length === 0) return json({ error: 'No fields to update' }, 400);

      sets.push("updated_at = datetime('now', '+5 hours', '+30 minutes')");
      vals.push(parseInt(segments[1]));

      d.prepare(`UPDATE lr_entries SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

      const entry = d.prepare('SELECT * FROM lr_entries WHERE id = ?').get(parseInt(segments[1]));
      if (entry && body.status && body.current_location) {
        const desc = body.description || `Shipment ${body.status.toLowerCase()} at ${body.current_location}`;
        d.prepare(`INSERT INTO tracking_updates (lr_number, location, status, description) VALUES (?, ?, ?, ?)`).run(entry.lr_number, body.current_location, body.status, desc);
      }

      return json({ success: true, consignment: entry });
    }

    if (event.httpMethod === 'DELETE' && segments[0] === 'lr' && segments[1]) {
      const entry = d.prepare('SELECT lr_number FROM lr_entries WHERE id = ?').get(parseInt(segments[1]));
      if (entry) {
        d.prepare('DELETE FROM tracking_updates WHERE lr_number = ?').run(entry.lr_number);
        d.prepare('DELETE FROM lr_entries WHERE id = ?').run(parseInt(segments[1]));
      }
      return json({ success: true, message: 'Deleted successfully' });
    }

    if (event.httpMethod === 'GET' && segments[0] === 'stats') {
      const total = d.prepare('SELECT COUNT(*) as cnt FROM lr_entries').get().cnt;
      const booked = d.prepare("SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Booked'").get().cnt;
      const inTransit = d.prepare("SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'In Transit'").get().cnt;
      const outForDelivery = d.prepare("SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Out for Delivery'").get().cnt;
      const delivered = d.prepare("SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Delivered'").get().cnt;
      return json({ total, booked, inTransit, outForDelivery, delivered });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
};
