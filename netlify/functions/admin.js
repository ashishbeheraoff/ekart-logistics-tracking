const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const SCHEMA_PATH = path.join(__dirname, '../../data/schema.sql');
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'ekart-admin-secret-2024';

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const { getDatabase } = require('@netlify/database');
    const db = getDatabase();
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await db.sql.unsafe(sql);
    return db;
  })();
  return dbPromise;
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
  if (!username) return null;
  return username;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const db = await getDb();
    let p = event.path.replace(/^\/api\/admin/, '').replace(/^\/\.netlify\/functions\/admin/, '');
    if (p.startsWith('/')) p = p.slice(1);
    const segments = p.split('/').filter(Boolean);

    if (event.httpMethod === 'POST' && segments[0] === 'login') {
      const body = getBody(event);
      if (!body || !body.username || !body.password) {
        return json({ error: 'Username and password required' }, 400);
      }
      const rows = await db.sql`SELECT password_hash FROM admin_users WHERE username = ${body.username}`;
      if (!rows || rows.length === 0 || rows[0].password_hash !== hashPassword(body.password)) {
        return json({ error: 'Invalid credentials' }, 401);
      }
      return json({ success: true, token: createToken(body.username), username: body.username });
    }

    const username = requireAuth(event);
    if (!username) return json({ error: 'Unauthorized' }, 401);

    if (event.httpMethod === 'GET' && segments[0] === 'lr') {
      if (segments[1]) {
        const entries = await db.sql`SELECT * FROM lr_entries WHERE id = ${parseInt(segments[1])}`;
        if (!entries || entries.length === 0) return json({ error: 'Not found' }, 404);
        const updates = await db.sql`
          SELECT * FROM tracking_updates WHERE lr_number = ${entries[0].lr_number} ORDER BY timestamp ASC
        `;
        return json({ consignment: entries[0], tracking_updates: updates });
      }
      const entries = await db.sql`SELECT * FROM lr_entries ORDER BY created_at DESC`;
      return json({ consignments: entries });
    }

    if (event.httpMethod === 'GET' && segments[0] === 'stats') {
      const total = (await db.sql`SELECT COUNT(*) as cnt FROM lr_entries`)[0].cnt;
      const booked = (await db.sql`SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Booked'`)[0].cnt;
      const inTransit = (await db.sql`SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'In Transit'`)[0].cnt;
      const outForDelivery = (await db.sql`SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Out for Delivery'`)[0].cnt;
      const delivered = (await db.sql`SELECT COUNT(*) as cnt FROM lr_entries WHERE status = 'Delivered'`)[0].cnt;
      return json({ total: Number(total), booked: Number(booked), inTransit: Number(inTransit), outForDelivery: Number(outForDelivery), delivered: Number(delivered) });
    }

    if (event.httpMethod === 'POST' && segments[0] === 'lr' && !segments[1]) {
      const body = getBody(event);
      if (!body || !body.origin || !body.destination) {
        return json({ error: 'Origin and destination are required' }, 400);
      }
      const countResult = await db.sql`SELECT COUNT(*) as cnt FROM lr_entries`;
      const count = Number(countResult[0].cnt) + 1;
      const lr_number = `EKT-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

      const [newEntry] = await db.sql`
        INSERT INTO lr_entries 
          (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
        VALUES 
          (${lr_number}, ${body.sender_name || ''}, ${body.sender_address || ''}, ${body.sender_phone || ''}, ${body.receiver_name || ''}, ${body.receiver_address || ''}, ${body.receiver_phone || ''}, ${body.origin}, ${body.destination}, ${body.package_desc || ''}, ${body.weight || ''}, ${body.status || 'Booked'}, ${body.current_location || body.origin}, ${body.estimated_delivery || ''})
        RETURNING *
      `;

      await db.sql`
        INSERT INTO tracking_updates (lr_number, location, status, description)
        VALUES (${lr_number}, ${body.origin}, 'Booked', ${`Shipment booked at ${body.origin}`})
      `;

      return json({ success: true, consignment: newEntry }, 201);
    }

    if (event.httpMethod === 'PUT' && segments[0] === 'lr' && segments[1]) {
      const body = getBody(event);
      if (!body) return json({ error: 'Invalid body' }, 400);

      const id = parseInt(segments[1]);
      const sets = [];
      const vals = [];
      const updatable = ['sender_name', 'sender_address', 'sender_phone', 'receiver_name', 'receiver_address', 'receiver_phone', 'origin', 'destination', 'package_desc', 'weight', 'status', 'current_location', 'estimated_delivery'];

      for (const f of updatable) {
        if (body[f] !== undefined) {
          sets.push(`${f} = $${vals.length + 1}`);
          vals.push(body[f]);
        }
      }
      if (sets.length === 0) return json({ error: 'No fields to update' }, 400);

      sets.push('updated_at = CURRENT_TIMESTAMP');
      vals.push(id);

      const updateSql = `UPDATE lr_entries SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`;
      const [updated] = await db.sql.unsafe(updateSql, vals);

      if (updated && body.status && body.current_location) {
        const desc = body.description || `Shipment ${body.status.toLowerCase()} at ${body.current_location}`;
        await db.sql`
          INSERT INTO tracking_updates (lr_number, location, status, description)
          VALUES (${updated.lr_number}, ${body.current_location}, ${body.status}, ${desc})
        `;
      }

      return json({ success: true, consignment: updated });
    }

    if (event.httpMethod === 'DELETE' && segments[0] === 'lr' && segments[1]) {
      const id = parseInt(segments[1]);
      const entries = await db.sql`SELECT lr_number FROM lr_entries WHERE id = ${id}`;
      if (entries && entries.length > 0) {
        await db.sql`DELETE FROM tracking_updates WHERE lr_number = ${entries[0].lr_number}`;
        await db.sql`DELETE FROM lr_entries WHERE id = ${id}`;
      }
      return json({ success: true, message: 'Deleted successfully' });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
};
