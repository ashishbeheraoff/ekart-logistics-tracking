CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lr_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lr_number TEXT UNIQUE NOT NULL,
  sender_name TEXT,
  sender_address TEXT,
  sender_phone TEXT,
  receiver_name TEXT,
  receiver_address TEXT,
  receiver_phone TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  package_desc TEXT,
  weight TEXT,
  status TEXT DEFAULT 'Booked',
  current_location TEXT,
  estimated_delivery TEXT,
  created_at TEXT DEFAULT (datetime('now', '+5 hours', '+30 minutes')),
  updated_at TEXT DEFAULT (datetime('now', '+5 hours', '+30 minutes'))
);

CREATE TABLE IF NOT EXISTS tracking_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lr_number TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  timestamp TEXT DEFAULT (datetime('now', '+5 hours', '+30 minutes')),
  FOREIGN KEY (lr_number) REFERENCES lr_entries(lr_number)
);

INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES
  ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

INSERT OR IGNORE INTO lr_entries (lr_number, sender_name, sender_address, sender_phone, receiver_name, receiver_address, receiver_phone, origin, destination, package_desc, weight, status, current_location, estimated_delivery) VALUES
  ('EKT-2024-001', 'Rajesh Sharma', '42, MG Road, Andheri East, Mumbai - 400093', '9876543210', 'Amit Patel', '78, Civil Lines, Delhi - 110054', '9876543211', 'Mumbai', 'Delhi', 'Electronics - 3 boxes', '15 kg', 'In Transit', 'Ahmedabad', '2024-06-28'),
  ('EKT-2024-002', 'Priya Singh', '15, Brigade Road, Bangalore - 560001', '9876543212', 'Suresh Kumar', '56, Anna Salai, Chennai - 600002', '9876543213', 'Bangalore', 'Chennai', 'Furniture - 2 chairs', '22 kg', 'Out for Delivery', 'Chennai', '2024-06-25'),
  ('EKT-2024-003', 'Vikram Mehta', '89, FC Road, Pune - 411004', '9876543214', 'Neha Gupta', '23, Banjara Hills, Hyderabad - 500034', '9876543215', 'Pune', 'Hyderabad', 'Books & Documents - 1 box', '5 kg', 'Delivered', 'Hyderabad', '2024-06-23');

INSERT OR IGNORE INTO tracking_updates (lr_number, location, status, description) VALUES
  ('EKT-2024-001', 'Mumbai', 'Booked', 'Shipment booked and picked up from sender'),
  ('EKT-2024-001', 'Mumbai', 'Departed', 'Shipment departed from Mumbai hub'),
  ('EKT-2024-001', 'Surat', 'In Transit', 'Shipment arrived at Surat transit hub'),
  ('EKT-2024-001', 'Surat', 'Departed', 'Shipment departed from Surat hub'),
  ('EKT-2024-001', 'Ahmedabad', 'In Transit', 'Shipment arrived at Ahmedabad transit hub'),
  ('EKT-2024-002', 'Bangalore', 'Booked', 'Shipment booked and picked up from sender'),
  ('EKT-2024-002', 'Bangalore', 'Departed', 'Shipment departed from Bangalore hub'),
  ('EKT-2024-002', 'Chennai', 'In Transit', 'Shipment arrived at Chennai hub'),
  ('EKT-2024-002', 'Chennai', 'Out for Delivery', 'Shipment out for delivery to receiver'),
  ('EKT-2024-003', 'Pune', 'Booked', 'Shipment booked and picked up from sender'),
  ('EKT-2024-003', 'Pune', 'Departed', 'Shipment departed from Pune hub'),
  ('EKT-2024-003', 'Hyderabad', 'In Transit', 'Shipment arrived at Hyderabad hub'),
  ('EKT-2024-003', 'Hyderabad', 'Out for Delivery', 'Shipment out for delivery to receiver'),
  ('EKT-2024-003', 'Hyderabad', 'Delivered', 'Shipment delivered successfully');
