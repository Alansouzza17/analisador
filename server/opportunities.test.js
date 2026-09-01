import assert from "node:assert/strict";
import test from "node:test";
import { buildOpportunities } from "./opportunities.js";

const now = new Date("2026-09-01T12:00:00.000Z");

test("gera oportunidade para histórico vazio e calendário vazio", () => {
  const items = buildOpportunities({ snapshots: [], contentPlans: [], now });
  assert.equal(items.some((item) => item.source === "Nenhuma coleta registrada"), true);
  assert.equal(items.some((item) => item.source === "0 conteúdos planejados"), true);
});

test("detecta queda real sem identificar usuário", () => {
  const items = buildOpportunities({ snapshots: [
    { capturedAt: "2026-08-30T12:00:00Z", followersCount: 100, mediaCount: 10 },
    { capturedAt: "2026-09-01T11:00:00Z", followersCount: 94, mediaCount: 10 },
  ], contentPlans: [{ status: "planejado", scheduledAt: "2026-09-02T12:00:00Z" }], now });
  const drop = items.find((item) => item.title.includes("queda"));
  assert.match(drop.source, /6 seguidores/);
  assert.match(drop.explanation, /não identifica/);
});

test("não afirma causalidade em comparação de frequência", () => {
  const items = buildOpportunities({ snapshots: [
    { capturedAt: "2026-08-01T12:00:00Z", followersCount: 80, mediaCount: 10 },
    { capturedAt: "2026-08-20T12:00:00Z", followersCount: 90, mediaCount: 20 },
    { capturedAt: "2026-09-01T11:00:00Z", followersCount: 95, mediaCount: 20 },
  ], contentPlans: [], now });
  assert.equal(items.some((item) => item.explanation.includes("não uma causa")), true);
});
