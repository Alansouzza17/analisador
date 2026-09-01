import assert from "node:assert/strict";
import test from "node:test";
import { validateContentPlan } from "./content-plans.js";

test("valida e normaliza um planejamento completo", () => {
  const data = validateContentPlan({
    title: "  Bastidores  ",
    description: "  Mostrar a rotina  ",
    contentType: "reels",
    status: "planejado",
    scheduledAt: "2026-09-10T15:00:00.000Z",
  });
  assert.equal(data.title, "Bastidores");
  assert.equal(data.description, "Mostrar a rotina");
  assert.equal(data.contentType, "reels");
  assert.equal(data.scheduledAt, "2026-09-10T15:00:00.000Z");
});

test("rejeita tipo, status e data inválidos", () => {
  assert.throws(() => validateContentPlan({ title: "Teste", contentType: "vídeo", status: "ideia" }), /Tipo/);
  assert.throws(() => validateContentPlan({ title: "Teste", contentType: "post", status: "rascunho" }), /Status/);
  assert.throws(() => validateContentPlan({ title: "Teste", contentType: "post", status: "ideia", scheduledAt: "amanhã" }), /Data/);
});

test("edição parcial exige ao menos um campo permitido", () => {
  assert.throws(() => validateContentPlan({}, { partial: true }), /Nenhum campo/);
  assert.deepEqual(validateContentPlan({ status: "publicado" }, { partial: true }), { status: "publicado" });
});
