const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const direction = process.argv[2] === 'down' ? 'down' : 'up';

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function getMigrationFiles(suffix) {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(`.${suffix}.sql`))
    .sort();
}

async function getAppliedMigrations() {
  const { rows } = await pool.query(
    'SELECT name FROM schema_migrations ORDER BY name'
  );
  return rows.map((r) => r.name);
}

async function migrateUp() {
  await ensureMigrationsTable();
  const applied = await SetFromArray(await getAppliedMigrations());
  const files = getMigrationFiles('up');

  for (const file of files) {
    const name = file.replace('.up.sql', '');
    if (applied.has(name)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
        [name]
      );
      await client.query('COMMIT');
      console.log(`Applied: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

async function migrateDown() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  if (applied.length === 0) {
    console.log('No migrations to roll back.');
    return;
  }

  const name = applied[applied.length - 1];
  const file = `${name}.down.sql`;
  const filePath = path.join(MIGRATIONS_DIR, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing down migration: ${file}`);
  }

  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1', [name]);
    await client.query('COMMIT');
    console.log(`Rolled back: ${name}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function SetFromArray(arr) {
  return new Set(arr);
}

async function main() {
  try {
    if (direction === 'down') {
      await migrateDown();
    } else {
      await migrateUp();
    }
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
