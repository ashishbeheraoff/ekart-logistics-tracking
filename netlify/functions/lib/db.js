const path = require('path');
const fs = require('fs');
const os = require('os');

const SCHEMA_PATH = path.join(__dirname, '../../../data/schema.sql');
const DB_PATH = path.join(os.tmpdir(), 'ekart.db');

let driver = null;

function convertParams(sql, params) {
  const converted = [];
  let idx = 0;
  const s = sql.replace(/\?/g, () => `$${++idx}`);
  return [s, params];
}

async function getDb() {
  if (driver) return driver;

  try {
    const { getDatabase } = require('@netlify/database');
    const d = getDatabase();
    const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    await d.sql.unsafe(sql);
    driver = {
      _type: 'netlify',
      async all(q, params) {
        if (params) {
          const [s, p] = convertParams(q, params);
          return (await d.sql.unsafe(s, p)) || [];
        }
        return (await d.sql.unsafe(q)) || [];
      },
      async get(q, params) {
        const [s, p] = convertParams(q, params);
        const rows = await d.sql.unsafe(s + ' LIMIT 1', p);
        return (rows && rows[0]) || null;
      },
      async run(q, params) {
        if (params) {
          const [s, p] = convertParams(q, params);
          await d.sql.unsafe(s, p);
        } else {
          await d.sql.unsafe(q);
        }
      },
      async unsafe(sql) {
        await d.sql.unsafe(sql);
      },
    };
    return driver;
  } catch {
    const { DatabaseSync } = require('node:sqlite');
    let db;
    if (fs.existsSync(DB_PATH)) {
      db = new DatabaseSync(DB_PATH);
    } else {
      db = new DatabaseSync(DB_PATH);
      const sql = fs.readFileSync(SCHEMA_PATH, 'utf8')
        .replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/REFERENCES.*ON DELETE CASCADE/g, 'REFERENCES lr_entries(lr_number)');
      db.exec(sql);
    }
    db.exec('PRAGMA journal_mode=WAL');

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
        if (params) {
          const stmt = db.prepare(q);
          stmt.bind(...params);
          stmt.step();
          stmt.free();
        } else {
          db.exec(q);
        }
      },
      unsafe(sql) {
        db.exec(sql);
      },
    };
    return driver;
  }
}

module.exports = { getDb };
