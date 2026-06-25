const path = require('path');
const fs = require('fs');
const { getDatabase } = require('@netlify/database');

async function main() {
  const db = getDatabase({ debug: true });
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.sql.unsafe(sql);
  const count = await db.sql`SELECT COUNT(*) as cnt FROM lr_entries`;
  console.log(`Database seeded. LR entries: ${count[0].cnt}`);
}

main().catch(console.error);
