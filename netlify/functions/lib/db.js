const crypto = require('crypto');
const { getDatabase } = require('@netlify/database');

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
SELECT 'EKT-2024-001', 'Rajesh Sharma', '42, MG Road, Andheri East, Mumbai - 400093', '9876543210', 'Amit Patel', '78, Civil Lines, Delhi - 110054', '9876543211', 'Mumbai', 'Delhi', 'Electronics - 3 boxes', '15 kg', 'Out for Delivery', 'Delhi', '2024-06-21'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-001');

INSERT INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
SELECT 'EKT-2024-002', 'Priya Singh', '15, Brigade Road, Bangalore - 560001', '9876543212', 'Suresh Kumar', '56, Anna Salai, Chennai - 600002', '9876543213', 'Bangalore', 'Chennai', 'Furniture - 2 chairs', '22 kg', 'Out for Delivery', 'Chennai', '2024-06-25'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-002');

INSERT INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery)
SELECT 'EKT-2024-003', 'Vikram Mehta', '89, FC Road, Pune - 411004', '9876543214', 'Neha Gupta', '23, Banjara Hills, Hyderabad - 500034', '9876543215', 'Pune', 'Hyderabad', 'Books & Documents - 1 box', '5 kg', 'Delivered', 'Hyderabad', '2024-06-23'
WHERE NOT EXISTS (SELECT 1 FROM lr_entries WHERE lr_number = 'EKT-2024-003');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Mumbai', 'Booked', 'Shipment booked and picked up from sender', '2024-06-15 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Mumbai', 'Picked Up', 'Package received at Mumbai hub', '2024-06-15 14:30:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND status = 'Picked Up');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Mumbai', 'Departed', 'Shipment departed from Mumbai hub', '2024-06-16 06:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Nashik', 'In Transit', 'Arrived at Nashik transit hub', '2024-06-16 18:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Nashik');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Nashik', 'Departed', 'Departed from Nashik hub', '2024-06-17 05:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Nashik' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Surat', 'In Transit', 'Arrived at Surat transit hub', '2024-06-17 14:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Surat');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Surat', 'Departed', 'Departed from Surat hub', '2024-06-18 06:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Surat' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Ahmedabad', 'In Transit', 'Arrived at Ahmedabad transit hub', '2024-06-18 16:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Ahmedabad');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Ahmedabad', 'Departed', 'Departed from Ahmedabad hub', '2024-06-19 07:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Ahmedabad' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Delhi', 'In Transit', 'Arrived at Delhi distribution center', '2024-06-19 20:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Delhi');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-001', 'Delhi', 'Out for Delivery', 'Out for delivery to receiver', '2024-06-20 08:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-001' AND location = 'Delhi' AND status = 'Out for Delivery');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Bangalore', 'Booked', 'Shipment booked and picked up from sender', '2024-06-22 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Bangalore', 'Picked Up', 'Package received at Bangalore hub', '2024-06-22 16:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Picked Up');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Bangalore', 'Departed', 'Shipment departed from Bangalore hub', '2024-06-23 07:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Krishnagiri', 'In Transit', 'Arrived at Krishnagiri transit hub', '2024-06-23 15:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND location = 'Krishnagiri');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Krishnagiri', 'Departed', 'Departed from Krishnagiri hub', '2024-06-24 06:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND location = 'Krishnagiri' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Chennai', 'In Transit', 'Arrived at Chennai hub', '2024-06-24 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND location = 'Chennai');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-002', 'Chennai', 'Out for Delivery', 'Out for delivery to receiver', '2024-06-25 08:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-002' AND status = 'Out for Delivery');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Pune', 'Booked', 'Shipment booked and picked up from sender', '2024-06-18 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Booked');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Pune', 'Picked Up', 'Package received at Pune hub', '2024-06-18 13:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Picked Up');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Pune', 'Departed', 'Shipment departed from Pune hub', '2024-06-19 06:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Solapur', 'In Transit', 'Arrived at Solapur transit hub', '2024-06-19 17:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND location = 'Solapur');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Solapur', 'Departed', 'Departed from Solapur hub', '2024-06-20 06:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND location = 'Solapur' AND status = 'Departed');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Hyderabad', 'In Transit', 'Arrived at Hyderabad hub', '2024-06-20 15:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND location = 'Hyderabad');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Hyderabad', 'Out for Delivery', 'Out for delivery to receiver', '2024-06-21 08:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Out for Delivery');

INSERT INTO tracking_updates (lr_number, location, status, description, timestamp)
SELECT 'EKT-2024-003', 'Hyderabad', 'Delivered', 'Shipment delivered successfully - Signed by Neha Gupta', '2024-06-21 14:00:00'
WHERE NOT EXISTS (SELECT 1 FROM tracking_updates WHERE lr_number = 'EKT-2024-003' AND status = 'Delivered');`;

let dbPromise = null;

async function getDb() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const db = getDatabase();
    const stmts = SCHEMA_SQL.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      try { await db.sql.unsafe(stmt); } catch (e) { console.error('Schema stmt:', e.message, stmt.slice(0, 80)); }
    }
    return {
      async all(q, params) {
        if (params) {
          let idx = 0; const s = q.replace(/\?/g, () => `$${++idx}`);
          return (await db.sql.unsafe(s, params)) || [];
        }
        return (await db.sql.unsafe(q)) || [];
      },
      async get(q, params) {
        if (params) {
          let idx = 0; const s = q.replace(/\?/g, () => `$${++idx}`) + ' LIMIT 1';
          const rows = await db.sql.unsafe(s, params);
          return (rows && rows[0]) || null;
        }
        const rows = await db.sql.unsafe(q + ' LIMIT 1');
        return (rows && rows[0]) || null;
      },
      async run(q, params) {
        if (params) { let idx = 0; const s = q.replace(/\?/g, () => `$${++idx}`); await db.sql.unsafe(s, params); }
        else { await db.sql.unsafe(q); }
      },
    };
  })();
  return dbPromise;
}

module.exports = { getDb };
