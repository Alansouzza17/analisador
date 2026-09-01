import { randomUUID } from "node:crypto";
import { query } from "./db.js";

export const CONTENT_TYPES = ["post", "reels", "story", "carrossel"];
export const CONTENT_STATUSES = ["ideia", "planejado", "publicado", "cancelado"];

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function normalizeDate(value, field, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) throw validationError(`${field} é obrigatório`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw validationError(`${field} inválido`);
  return date.toISOString();
}

export function validateContentPlan(input, { partial = false } = {}) {
  const output = {};
  if (!partial || Object.hasOwn(input, "title")) {
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (!title || title.length > 160) throw validationError("Título deve ter entre 1 e 160 caracteres");
    output.title = title;
  }
  if (!partial || Object.hasOwn(input, "description")) {
    output.description = typeof input.description === "string" && input.description.trim()
      ? input.description.trim()
      : null;
  }
  if (!partial || Object.hasOwn(input, "contentType")) {
    if (!CONTENT_TYPES.includes(input.contentType)) throw validationError("Tipo de conteúdo inválido");
    output.contentType = input.contentType;
  }
  if (!partial || Object.hasOwn(input, "status")) {
    const status = input.status ?? "ideia";
    if (!CONTENT_STATUSES.includes(status)) throw validationError("Status inválido");
    output.status = status;
  }
  if (!partial || Object.hasOwn(input, "scheduledAt")) {
    output.scheduledAt = normalizeDate(input.scheduledAt, "Data programada");
  }
  if (!partial || Object.hasOwn(input, "publishedAt")) {
    output.publishedAt = normalizeDate(input.publishedAt, "Data de publicação");
  }
  if (partial && Object.keys(output).length === 0) throw validationError("Nenhum campo válido foi informado");
  return output;
}

function mapContentPlan(row) {
  return {
    id: row.id,
    instagramAccountId: row.instagram_account_id,
    title: row.title,
    description: row.description,
    contentType: row.content_type,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listContentPlans({ userId, instagramAccountId, status }) {
  const params = [userId, instagramAccountId];
  const statusClause = status ? `AND status = $${params.push(status)}` : "";
  const result = await query(
    `SELECT * FROM instagram_content_plans
     WHERE user_id = $1 AND instagram_account_id = $2 ${statusClause}
     ORDER BY scheduled_at ASC NULLS LAST, created_at DESC`,
    params
  );
  return result.rows.map(mapContentPlan);
}

export async function createContentPlan({ userId, instagramAccountId, input }) {
  const data = validateContentPlan(input);
  const result = await query(
    `INSERT INTO instagram_content_plans
      (id, user_id, instagram_account_id, title, description, content_type, status, scheduled_at, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [randomUUID(), userId, instagramAccountId, data.title, data.description, data.contentType, data.status, data.scheduledAt, data.publishedAt]
  );
  return mapContentPlan(result.rows[0]);
}

export async function updateContentPlan({ id, userId, instagramAccountId, input }) {
  const data = validateContentPlan(input, { partial: true });
  const columns = {
    title: "title",
    description: "description",
    contentType: "content_type",
    status: "status",
    scheduledAt: "scheduled_at",
    publishedAt: "published_at",
  };
  const params = [];
  const assignments = Object.entries(data).map(([key, value]) => {
    params.push(value);
    return `${columns[key]} = $${params.length}`;
  });
  params.push(id, userId, instagramAccountId);
  const result = await query(
    `UPDATE instagram_content_plans SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE id = $${params.length - 2} AND user_id = $${params.length - 1} AND instagram_account_id = $${params.length}
     RETURNING *`,
    params
  );
  return result.rows[0] ? mapContentPlan(result.rows[0]) : null;
}

export async function deleteContentPlan({ id, userId, instagramAccountId }) {
  const result = await query(
    `DELETE FROM instagram_content_plans
     WHERE id = $1 AND user_id = $2 AND instagram_account_id = $3
     RETURNING id`,
    [id, userId, instagramAccountId]
  );
  return Boolean(result.rows[0]);
}
