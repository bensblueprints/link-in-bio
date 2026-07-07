#!/usr/bin/env node
// Applies every .sql file in /migrations against Postgres, in filename order,
// recording what's already run in a _migrations table. Only used in
// APP_MODE=multi (the self-host SQLite path has its own inline schema in
// server/db.js and needs no migration step).
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in first.');
  }

  const client = new Client({ connectionString });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows: applied } = await client.query('SELECT filename FROM _migrations');
  const appliedSet = new Set(applied.map((r) => r.filename));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranAny = false;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`apply ${file}`);
    try {
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      ranAny = true;
    } catch (err) {
      await client.end();
      throw new Error(`Migration ${file} failed: ${err.message}`);
    }
  }

  await client.end();
  console.log(ranAny ? 'Migrations complete.' : 'Nothing to do — already up to date.');
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
