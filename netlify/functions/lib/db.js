const os = require('os');

const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lr_entries (
  id SERIAL PRIMARY KEY,
  lr_number TEXT UNIQUE NOT NULL,
  sender_name TEXT DEFAULT '',
  sender_address TEXT DEFAULT '',
  sender_phone TEXT DEFAULT '',
  receiver_name TEXT DEFAULT '',
  receiver_address TEXT DEFAULT '',
  receiver_phone TEXT DEFAULT '',
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  package_desc TEXT DEFAULT '',
  weight TEXT DEFAULT '',
  status TEXT DEFAULT 'Booked',
  current_location TEXT DEFAULT '',
  estimated_delivery TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracking_updates (
  id SERIAL PRIMARY KEY,
  lr_number TEXT NOT NULL REFERENCES lr_entries(lr_number) ON DELETE CASCADE,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT DEFAULT '',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_users (username, password_hash)
SELECT 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

INSERT INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
SELECT 'EKT-2024-001', 'Rajesh Sharma', '42, MG Road, Andheri East, Mumbai - 400093', '9876543210', 'Amit Patel', '78, Civil Lines, Delhi - 110054', '9876543211', 'Mumbai', 'Delhi', 'Electronics - 3 boxes', '15 kg', 'In Transit', 'Ahmedabad', '2024-06-28'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-001');

INSERT INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
SELECT 'EKT-2024-002', 'Priya Singh', '15, Brigade Road, Bangalore - 560001', '9876543212', 'Suresh Kumar', '56, Anna Salai, Chennai - 600002', '9876543213', 'Bangalore', 'Chennai', 'Furniture - 2 chairs', '22 kg', 'Out for Delivery', 'Chennai', '2024-06-25'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-002');

INSERT INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
SELECT 'EKT-2024-003', 'Vikram Mehta', '89, FC Road, Pune - 411004', '9876543214', 'Neha Gupta', '23, Banjara Hills, Hyderabad - 500034', '9876543215', 'Pune', 'Hyderabad', 'Books & Documents - 1 box', '5 kg', 'Delivered', 'Hyderabad', '2024-06-23'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-003');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-001', 'Mumbai', 'Booked', 'Shipment booked and picked up from sender'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-001', 'Mumbai', 'Departed', 'Shipment departed from Mumbai hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-001', 'Surat', 'In Transit', 'Shipment arrived at Surat transit hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Surat');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-001', 'Surat', 'Departed', 'Shipment departed from Surat hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Surat' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-001', 'Ahmedabad', 'In Transit', 'Shipment arrived at Ahmedabad transit hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Ahmedabad');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-002', 'Bangalore', 'Booked', 'Shipment booked and picked up from sender'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-002', 'Bangalore', 'Departed', 'Shipment departed from Bangalore hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-002', 'Chennai', 'In Transit', 'Shipment arrived at Chennai hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND location = 'Chennai');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-002', 'Chennai', 'Out for Delivery', 'Shipment out for delivery to receiver'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Out for Delivery');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-003', 'Pune', 'Booked', 'Shipment booked and picked up from sender'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-003', 'Pune', 'Departed', 'Shipment departed from Pune hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-003', 'Hyderabad', 'In Transit', 'Shipment arrived at Hyderabad hub'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND location = 'Hyderabad');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-003', 'Hyderabad', 'Out for Delivery', 'Shipment out for delivery to receiver'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Out for Delivery');

INSERT INTO tracking_updates (lr_number, location, status, description)
SELECT 'EKT-2024-003', 'Hyderabad', 'Delivered', 'Shipment delivered successfully'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Delivered');`;

const DB_PATH = path.join(os.tmpdir(), 'ekart.db');

let driver = null;

function splitStatements(sql) {
  return sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
}

async function ensureSchema(driver, type) {
  const tables = ['admin_users', 'lr_entries', 'tracking_updates'];
  let tableExists = false;

  for (const t of tables) {
    try {
      if (type === 'netlify') {
        await driver.sql.unsafe(`SELECT 1 FROM ${t} LIMIT 1`);
      } else if (type === 'sqlite') {
        driver.exec(`SELECT 1 FROM ${t} LIMIT 1`);
      }
      tableExists = true;
      break;
    } catch {}
  }

  if (tableExists) return;

  const stmts = splitStatements(SCHEMA_SQL);

  for (const stmt of stmts) {
    try {
      if (type === 'netlify') {
        await driver.sql.unsafe(stmt);
      } else {
        let s = stmt;
        s = s.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
        s = s.replace(/REFERENCES.*ON DELETE CASCADE/g, 'REFERENCES lr_entries(lr_number)');
        driver.exec(s);
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

  const driverTypes = ['@netlify/database', 'node:sqlite', 'better-sqlite3'];

  for (const driverType of driverTypes) {
    try {
      if (driverType === '@netlify/database') {
        if (!process.env.NETLIFY_DB_URL) continue;
        const { getDatabase } = require('@netlify/database');
        const d = getDatabase();
        await ensureSchema(d, 'netlify');
        driver = {
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
        };
        return driver;
      }

      if (driverType === 'node:sqlite') {
        const { DatabaseSync } = require('node:sqlite');
        const db = new DatabaseSync(DB_PATH);
        db.exec('PRAGMA journal_mode=WAL');
        await ensureSchema(db, 'sqlite');
        driver = createSqliteDriver(db);
        return driver;
      }

      if (driverType === 'better-sqlite3') {
        const Database = require('better-sqlite3');
        const db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        await ensureSchema(db, 'sqlite');
        driver = {
          all(q, params) { return params ? db.prepare(q).all(...params) : db.prepare(q).all(); },
          get(q, params) { return params ? db.prepare(q).get(...params) : db.prepare(q).get(); },
          run(q, params) { if (params) db.prepare(q).run(...params); else db.exec(q); },
        };
        return driver;
      }
    } catch (e) {
      console.error(`Driver ${driverType} failed:`, e.message);
    }
  }

  const nodeVer = process.version;
  const hasNodeSqlite = (() => { try { require('node:sqlite'); return true; } catch { return false; } })();
  const hasBetterSqlite = (() => { try { require('better-sqlite3'); return true; } catch { return false; } })();
  throw new Error(`No database driver available (Node ${nodeVer}, NETLIFY_DB_URL=${!!process.env.NETLIFY_DB_URL}, node:sqlite=${hasNodeSqlite}, better-sqlite3=${hasBetterSqlite})`);
}

function createSqliteDriver(db) {
  return {
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
  };
}

module.exports = { getDb };
