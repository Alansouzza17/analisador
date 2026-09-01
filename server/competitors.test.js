import assert from "node:assert/strict";
import test from "node:test";
import { listCompetitors, normalizeInstagramUsername, updateCompetitor, validateCompetitor } from "./competitors.js";

test("normaliza username e valida limites", () => {
  assert.equal(normalizeInstagramUsername(" @Perfil.Teste "), "perfil.teste");
  assert.throws(() => normalizeInstagramUsername("perfil inválido"), /username válido/);
  assert.throws(() => validateCompetitor({ username: "perfil", notes: "x".repeat(2001) }), /2000/);
});

test("listagem aplica isolamento por usuário e conta", async () => {
  let receivedParams;
  const queryFn = async (_sql, params) => { receivedParams = params; return { rows: [] }; };
  await listCompetitors({ userId: "user-a", instagramAccountId: "account-a" }, queryFn);
  assert.deepEqual(receivedParams, ["user-a", "account-a"]);
});

test("edição de outro usuário não encontra registro", async () => {
  let receivedParams;
  const queryFn = async (_sql, params) => { receivedParams = params; return { rows: [] }; };
  const result = await updateCompetitor({ id: "item-a", userId: "user-b", instagramAccountId: "account-b", input: { notes: "teste" } }, queryFn);
  assert.equal(result, null);
  assert.deepEqual(receivedParams.slice(-3), ["item-a", "user-b", "account-b"]);
});
