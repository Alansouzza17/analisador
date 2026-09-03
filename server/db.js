import pg from "pg";

const { Pool } = pg;
let pool;

function databaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    const error = new Error("DATABASE_URL não configurada");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }

  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname) {
      throw new Error();
    }
    if (["base", "host", "hostname"].includes(url.hostname.toLowerCase())) {
      throw new Error();
    }
  } catch {
    const error = new Error(
      "DATABASE_URL inválida: use a Internal Database URL completa fornecida pelo PostgreSQL no Render"
    );
    error.code = "DATABASE_INVALID";
    throw error;
  }

  return value;
}

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
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
