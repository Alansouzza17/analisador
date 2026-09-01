import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { closeDb, query } from "./db.js";

try {
  const migrationsUrl = new URL("./migrations/", import.meta.url);
  const migrationFiles = (await readdir(migrationsUrl))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();

  for (const file of migrationFiles) {
    const migration = await readFile(new URL(file, migrationsUrl), "utf8");
    await query(migration);
    console.log(`Migration ${file} aplicada com sucesso.`);
  }
} finally {
  await closeDb();
}
