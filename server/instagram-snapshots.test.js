import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateGrowth,
  DEFAULT_SNAPSHOT_LIMIT,
  MAX_SNAPSHOT_LIMIT,
  normalizeSnapshotFilters,
} from "./instagram-snapshots.js";

test("normaliza limite e período do histórico", () => {
  assert.deepEqual(normalizeSnapshotFilters({}), { limit: DEFAULT_SNAPSHOT_LIMIT, days: null });
  assert.deepEqual(normalizeSnapshotFilters({ limit: "0", days: "-2" }), { limit: 1, days: null });
  assert.deepEqual(normalizeSnapshotFilters({ limit: "9999", days: "30" }), {
    limit: MAX_SNAPSHOT_LIMIT,
    days: 30,
  });
});

test("crescimento informa quando faltam snapshots", () => {
  const growth = calculateGrowth([]);
  assert.equal(growth.sufficientData, false);
  assert.equal(growth.snapshotCount, 0);
  assert.equal(growth.followers, null);
});

test("crescimento ordena por data e calcula diferenças", () => {
  const growth = calculateGrowth([
    { capturedAt: "2026-02-01T00:00:00Z", followersCount: 120, followsCount: 40, mediaCount: 12 },
    { capturedAt: "2026-01-01T00:00:00Z", followersCount: 100, followsCount: 50, mediaCount: 10 },
  ]);
  assert.equal(growth.sufficientData, true);
  assert.deepEqual(growth.followers, { start: 100, end: 120, absolute: 20, percentage: 20 });
  assert.deepEqual(growth.follows, { start: 50, end: 40, absolute: -10, percentage: -20 });
  assert.deepEqual(growth.media, { start: 10, end: 12, absolute: 2, percentage: 20 });
  assert.deepEqual(growth.followersActivity, { gained: 20, lost: 0, net: 20 });
});

test("crescimento acumula ganhos e perdas entre coletas", () => {
  const growth = calculateGrowth([
    { capturedAt: "2026-01-01T00:00:00Z", followersCount: 100, followsCount: 1, mediaCount: 1 },
    { capturedAt: "2026-01-02T00:00:00Z", followersCount: 112, followsCount: 1, mediaCount: 1 },
    { capturedAt: "2026-01-03T00:00:00Z", followersCount: 107, followsCount: 1, mediaCount: 1 },
  ]);
  assert.deepEqual(growth.followersActivity, { gained: 12, lost: 5, net: 7 });
});

test("variação percentual é nula quando a base é zero", () => {
  const growth = calculateGrowth([
    { capturedAt: "2026-01-01T00:00:00Z", followersCount: 0, followsCount: 0, mediaCount: 0 },
    { capturedAt: "2026-02-01T00:00:00Z", followersCount: 5, followsCount: 1, mediaCount: 2 },
  ]);
  assert.equal(growth.followers.percentage, null);
  assert.equal(growth.followers.absolute, 5);
});
