/**
 * @file Runs numbered SQL migration files from the /migrations directory in order.
 * Usage: npx tsx scripts/migrate.ts
 *
 * Reads all .sql files matching the pattern NNN_*.sql, sorts them numerically,
 * and executes each one against the DATABASE_URL database. Each migration is
 * wrapped in a transaction. Idempotent — uses CREATE TABLE IF NOT EXISTS.
 */

import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate(): Promise<void> {
  const migrationsDir = path.join(process.cwd(), "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error("No migrations/ directory found.");
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`Running ${files.length} migrations...\n`);

  for (const file of files) {
    const filepath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filepath, "utf-8");

    try {
      await pool.query("BEGIN");
      await pool.query(sql);
      await pool.query("COMMIT");
      console.log(`  ✓ ${file}`);
    } catch (error) {
      await pool.query("ROLLBACK");
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ ${file}: ${message}`);
      process.exit(1);
    }
  }

  console.log("\nAll migrations completed.");
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Migration failed:", err);
    pool.end();
    process.exit(1);
  });
