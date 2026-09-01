import { randomUUID } from "node:crypto";
import { query } from "./db.js";

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

export function normalizeInstagramUsername(value) {
  const username = typeof value === "string" ? value.trim().replace(/^@+/, "").toLowerCase() : "";
  if (!/^[a-z0-9._]{1,30}$/.test(username)) {
    throw validationError("Informe um username válido, sem @");
  }
  return username;
}

export function validateCompetitor(input, { partial = false } = {}) {
  const data = {};
  if (!partial || Object.hasOwn(input, "username")) data.username = normalizeInstagramUsername(input.username);
  if (!partial || Object.hasOwn(input, "displayName")) {
    const value = typeof input.displayName === "string" ? input.displayName.trim() : "";
    if (value.length > 160) throw validationError("Nome ou apelido deve ter no máximo 160 caracteres");
    data.displayName = value || null;
  }
  if (!partial || Object.hasOwn(input, "notes")) {
    const value = typeof input.notes === "string" ? input.notes.trim() : "";
    if (value.length > 2000) throw validationError("Observações devem ter no máximo 2000 caracteres");
    data.notes = value || null;
  }
  if (partial && Object.keys(data).length === 0) throw validationError("Nenhum campo válido foi informado");
  return data;
}

function mapCompetitor(row) {
  return {
    id: row.id,
    instagramAccountId: row.instagram_account_id,
    username: row.username,
    displayName: row.display_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metricsAvailable: false,
  };
}

export async function listCompetitors({ userId, instagramAccountId }, queryFn = query) {
  const result = await queryFn(
    `SELECT * FROM instagram_competitor_profiles
     WHERE user_id = $1 AND instagram_account_id = $2
     ORDER BY created_at DESC`,
    [userId, instagramAccountId]
  );
  return result.rows.map(mapCompetitor);
}

export async function createCompetitor({ userId, instagramAccountId, input }, queryFn = query) {
  const data = validateCompetitor(input);
  const result = await queryFn(
    `INSERT INTO instagram_competitor_profiles
      (id, user_id, instagram_account_id, username, display_name, notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [randomUUID(), userId, instagramAccountId, data.username, data.displayName, data.notes]
  );
  return mapCompetitor(result.rows[0]);
}

export async function updateCompetitor({ id, userId, instagramAccountId, input }, queryFn = query) {
  const data = validateCompetitor(input, { partial: true });
  const columns = { username: "username", displayName: "display_name", notes: "notes" };
  const params = [];
  const assignments = Object.entries(data).map(([key, value]) => {
    params.push(value);
    return `${columns[key]} = $${params.length}`;
  });
  params.push(id, userId, instagramAccountId);
  const result = await queryFn(
    `UPDATE instagram_competitor_profiles SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length - 2} AND user_id = $${params.length - 1}
       AND instagram_account_id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0] ? mapCompetitor(result.rows[0]) : null;
}

export async function deleteCompetitor({ id, userId, instagramAccountId }, queryFn = query) {
  const result = await queryFn(
    `DELETE FROM instagram_competitor_profiles
     WHERE id = $1 AND user_id = $2 AND instagram_account_id = $3 RETURNING id`,
    [id, userId, instagramAccountId]
  );
  return Boolean(result.rows[0]);
}
