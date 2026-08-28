import pg from "pg";

const { Pool } = pg;
let pool;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL não configurada");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export async function query(text, params = []) {
  return getDb().query(text, params);
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = undefined;
}
