const crypto = require('crypto');
const { getDb } = require('./lib/db');

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'ekart-captcha-secret-2024';

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const token = crypto.createHmac('sha256', CAPTCHA_SECRET).update(code).digest('hex');
  return { question: code, token };
}

function verifyCaptcha(answer, token) {
  if (!answer || !token) return false;
  const expected = crypto.createHmac('sha256', CAPTCHA_SECRET).update(answer.toUpperCase()).digest('hex');
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
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  try {
    const db = await getDb();
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

      const entries = await db.all('SELECT * FROM lr_entries WHERE lr_number = ?', [lr_number.toUpperCase()]);
      if (!entries || entries.length === 0) {
        return json({ error: 'No shipment found with LR Number: ' + lr_number.toUpperCase() }, 404);
      }

      const updates = await db.all('SELECT * FROM tracking_updates WHERE lr_number = ? ORDER BY timestamp ASC', [lr_number.toUpperCase()]);

      return json({ success: true, consignment: entries[0], tracking_updates: updates });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: err.message || 'Internal error' }, 500);
  }
};
