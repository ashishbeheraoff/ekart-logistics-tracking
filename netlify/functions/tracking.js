const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

const DB_PATH = path.join(os.tmpdir(), 'ekart.db');
const SCHEMA_PATH = path.join(__dirname, '../../data/schema.sql');
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'ekart-captcha-secret-2024';

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

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 5;
  const b = Math.floor(Math.random() * 20) + 5;
  const op = Math.random() > 0.5 ? '+' : '*';
  const answer = op === '+' ? a + b : a * b;
  const question = `What is ${a} ${op} ${b}?`;
  const token = crypto.createHmac('sha256', CAPTCHA_SECRET).update(String(answer)).digest('hex');
  return { question, token };
}

function verifyCaptcha(answer, token) {
  if (!answer || !token) return false;
  const expected = crypto.createHmac('sha256', CAPTCHA_SECRET).update(String(parseInt(answer))).digest('hex');
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body, (k, v) => typeof v === 'bigint' ? Number(v) : v),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const d = getDb();
    const p = event.path.replace(/^\/api\/tracking/, '').replace(/^\/\.netlify\/functions\/tracking/, '');

    if (event.httpMethod === 'GET' && (p === '' || p === '/captcha')) {
      return json({ captcha: generateCaptcha() });
    }

    if (event.httpMethod === 'POST' && (p === '' || p === '/track')) {
      const body = JSON.parse(event.body || '{}');
      const { lr_number, captcha_answer, captcha_token } = body;

      if (!lr_number || !captcha_answer || !captcha_token) {
        return json({ error: 'LR Number, captcha answer, and captcha token are required' }, 400);
      }

      if (!verifyCaptcha(captcha_answer, captcha_token)) {
        return json({ error: 'Invalid captcha answer. Please try again.' }, 400);
      }

      const entry = d.prepare('SELECT * FROM lr_entries WHERE lr_number = ?').get(lr_number.toUpperCase());
      if (!entry) {
        return json({ error: 'No shipment found with LR Number: ' + lr_number.toUpperCase() }, 404);
      }

      const updates = d.prepare('SELECT * FROM tracking_updates WHERE lr_number = ? ORDER BY timestamp ASC').all(lr_number.toUpperCase());

      return json({ success: true, consignment: entry, tracking_updates: updates });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
};
