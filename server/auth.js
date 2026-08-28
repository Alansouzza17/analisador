import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { query } from "./db.js";

const ACCESS_TOKEN_TTL = "7d";

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url || null,
  };
}

function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não configurado");
  return process.env.JWT_SECRET;
}

export function createAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, jwtSecret(), {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: "analisador-api",
    audience: "analisador-app",
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret(), {
    issuer: "analisador-api",
    audience: "analisador-app",
  });
}

export function bearerToken(req) {
  const value = req.headers.authorization;
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

export async function requireUser(req, res, next) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: "Autenticação necessária" });
    const payload = verifyAccessToken(token);
    const result = await query(
      "SELECT id, name, email, avatar_url FROM users WHERE id = $1",
      [payload.sub]
    );
    if (!result.rows[0]) return res.status(401).json({ error: "Sessão inválida" });
    req.user = result.rows[0];
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return Boolean(hash) && bcrypt.compare(password, hash);
}

export function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

export async function issuePasswordReset(userId) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')`,
    [randomUUID(), userId, tokenHash]
  );
  return rawToken;
}

export async function consumePasswordReset(rawToken, passwordHash) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const client = await (await import("./db.js")).getDb().connect();
  try {
    await client.query("BEGIN");
    const tokenResult = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash]
    );
    const reset = tokenResult.rows[0];
    if (!reset) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, reset.user_id]);
    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [reset.id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
