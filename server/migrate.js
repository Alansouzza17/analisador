import "dotenv/config";
import { readFile } from "node:fs/promises";
import { closeDb, query } from "./db.js";

const migration = await readFile(new URL("./migrations/001_auth.sql", import.meta.url), "utf8");

try {
  await query(migration);
  console.log("Migration 001_auth aplicada com sucesso.");
} finally {
  await closeDb();
}
