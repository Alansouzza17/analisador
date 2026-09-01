import { randomUUID } from "node:crypto";
import { getDb, query } from "./db.js";

export const SNAPSHOT_MIN_INTERVAL_MINUTES = 15;
export const DEFAULT_SNAPSHOT_LIMIT = 30;
export const MAX_SNAPSHOT_LIMIT = 365;

function mapSnapshot(row) {
  return {
    id: row.id,
    instagramAccountId: row.instagram_account_id,
    followersCount: row.followers_count,
    followsCount: row.follows_count,
    mediaCount: row.media_count,
    capturedAt: row.captured_at,
    createdAt: row.created_at,
  };
}

export function normalizeSnapshotFilters(filters = {}) {
  const requestedLimit = Number.parseInt(String(filters.limit ?? ""), 10);
  const requestedDays = Number.parseInt(String(filters.days ?? ""), 10);
  return {
    limit: Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), MAX_SNAPSHOT_LIMIT)
      : DEFAULT_SNAPSHOT_LIMIT,
    days: Number.isFinite(requestedDays) && requestedDays > 0
      ? Math.min(requestedDays, 3650)
      : null,
  };
}

export async function findOwnedInstagramAccount(userId, instagramUserId) {
  const result = await query(
    `SELECT id, user_id, instagram_user_id, access_token
     FROM instagram_accounts
     WHERE user_id = $1 AND instagram_user_id = $2`,
    [userId, String(instagramUserId)]
  );
  return result.rows[0] || null;
}

export async function createAccountSnapshot({ userId, instagramAccountId, profile }) {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [instagramAccountId]);
    const recent = await client.query(
      `SELECT * FROM instagram_account_snapshots
       WHERE user_id = $1 AND instagram_account_id = $2
         AND captured_at >= NOW() - ($3 * INTERVAL '1 minute')
       ORDER BY captured_at DESC LIMIT 1`,
      [userId, instagramAccountId, SNAPSHOT_MIN_INTERVAL_MINUTES]
    );
    if (recent.rows[0]) {
      await client.query("COMMIT");
      return { snapshot: mapSnapshot(recent.rows[0]), created: false };
    }
    const inserted = await client.query(
      `INSERT INTO instagram_account_snapshots
        (id, user_id, instagram_account_id, followers_count, follows_count, media_count, captured_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [randomUUID(), userId, instagramAccountId, profile.followers_count, profile.follows_count, profile.media_count]
    );
    await client.query("COMMIT");
    return { snapshot: mapSnapshot(inserted.rows[0]), created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listAccountSnapshots({ userId, instagramAccountId, limit, days }) {
  const params = [userId, instagramAccountId];
  const periodClause = days
    ? `AND captured_at >= NOW() - ($${params.push(days)} * INTERVAL '1 day')`
    : "";
  params.push(limit);
  const result = await query(
    `SELECT * FROM instagram_account_snapshots
     WHERE user_id = $1 AND instagram_account_id = $2 ${periodClause}
     ORDER BY captured_at DESC, created_at DESC LIMIT $${params.length}`,
    params
  );
  return result.rows.map(mapSnapshot);
}

function metricGrowth(first, last, key) {
  const start = first[key];
  const end = last[key];
  const absolute = end - start;
  return { start, end, absolute, percentage: start === 0 ? null : (absolute / start) * 100 };
}

export function calculateGrowth(snapshots) {
  if (snapshots.length < 2) {
    return {
      sufficientData: false,
      message: "São necessários pelo menos dois snapshots para calcular o crescimento.",
      snapshotCount: snapshots.length,
      period: null,
      followers: null,
      follows: null,
      media: null,
      followersActivity: null,
    };
  }
  const ordered = [...snapshots].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
  );
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  let gained = 0;
  let lost = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const change = ordered[index].followersCount - ordered[index - 1].followersCount;
    if (change > 0) gained += change;
    if (change < 0) lost += Math.abs(change);
  }
  return {
    sufficientData: true,
    message: null,
    snapshotCount: ordered.length,
    period: { from: first.capturedAt, to: last.capturedAt },
    followers: metricGrowth(first, last, "followersCount"),
    follows: metricGrowth(first, last, "followsCount"),
    media: metricGrowth(first, last, "mediaCount"),
    followersActivity: { gained, lost, net: last.followersCount - first.followersCount },
  };
}
