const path = require('path');
const fs = require('fs');
const os = require('os');

const SCHEMA_PATH = path.join(__dirname, '../schema.sql');
const DB_PATH = path.join(os.tmpdir(), 'ekart.db');

let driver = null;

function splitStatements(sql) {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

async function ensureSchema(db, type) {
  const tables = ['admin_users', 'lr_entries', 'tracking_updates'];
  let tableExists = false;

  for (const t of tables) {
    try {
      if (type === 'netlify') {
        await db.sql.unsafe(`SELECT 1 FROM ${t} LIMIT 1`);
      } else {
        db.exec(`SELECT 1 FROM ${t} LIMIT 1`);
      }
      tableExists = true;
      break;
    } catch {}
  }

  if (tableExists) return;

  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const stmts = splitStatements(raw);

  for (const stmt of stmts) {
    try {
      if (type === 'netlify') {
        let s = stmt;
        if (s.includes('SERIAL PRIMARY KEY')) s = s.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
        await db.sql.unsafe(s);
      } else {
        let s = stmt;
        s = s.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
        s = s.replace(/REFERENCES.*ON DELETE CASCADE/g, 'REFERENCES lr_entries(lr_number)');
        db.exec(s);
      }
    } catch (e) {
      console.error(`Schema statement failed (${type}):`, e.message, stmt.slice(0, 80));
    }
  }
}

function convertParams(sql, params) {
  let idx = 0;
  const s = sql.replace(/\?/g, () => `$${++idx}`);
  return [s, params];
}

async function getDb() {
  if (driver) return driver;

  for (const driverType of ['@netlify/database', 'node:sqlite']) {
    try {
      if (driverType === '@netlify/database') {
        if (!process.env.NETLIFY_DB_URL) continue;
        const { getDatabase } = require('@netlify/database');
        const d = getDatabase();
        await ensureSchema(d, 'netlify');
        driver = {
          _type: 'netlify',
          async all(q, params) {
            if (params) { const [s, p] = convertParams(q, params); return (await d.sql.unsafe(s, p)) || []; }
            return (await d.sql.unsafe(q)) || [];
          },
          async get(q, params) {
            const [s, p] = convertParams(q, params);
            const rows = await d.sql.unsafe(s + ' LIMIT 1', p);
            return (rows && rows[0]) || null;
          },
          async run(q, params) {
            if (params) { const [s, p] = convertParams(q, params); await d.sql.unsafe(s, p); }
            else { await d.sql.unsafe(q); }
          },
          async unsafe(sql) { await d.sql.unsafe(sql); },
        };
        return driver;
      }

      if (driverType === 'node:sqlite') {
        const { DatabaseSync } = require('node:sqlite');
        const db = new DatabaseSync(DB_PATH);
        db.exec('PRAGMA journal_mode=WAL');
        await ensureSchema(db, 'sqlite');
        driver = {
          _type: 'sqlite',
          all(q, params) {
            const stmt = db.prepare(q);
            if (params) stmt.bind(...params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return rows;
          },
          get(q, params) {
            const stmt = db.prepare(q + ' LIMIT 1');
            if (params) stmt.bind(...params);
            let row = null;
            if (stmt.step()) row = stmt.getAsObject();
            stmt.free();
            return row || null;
          },
          run(q, params) {
            if (params) { const stmt = db.prepare(q); stmt.bind(...params); stmt.step(); stmt.free(); }
            else { db.exec(q); }
          },
          unsafe(sql) { db.exec(sql); },
        };
        return driver;
      }
    } catch (e) {
      console.error(`Driver ${driverType} failed:`, e.message);
    }
  }

  throw new Error('No database driver available');
}

module.exports = { getDb };
