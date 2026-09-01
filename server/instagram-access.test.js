import assert from "node:assert/strict";
import test from "node:test";
import { validateInstagramSessionOwner } from "./instagram-access.js";

test("rejeita sessão inválida e conta ausente", () => {
  assert.equal(validateInstagramSessionOwner(null, "user-a").status, 401);
  assert.equal(validateInstagramSessionOwner({ userId: "user-a", profile: {} }, "user-a").status, 400);
});

test("impede que sessão de outro usuário seja utilizada", () => {
  assert.equal(validateInstagramSessionOwner({ userId: "user-a", profile: { id: "ig-a" } }, "user-b").status, 403);
});

test("aceita somente sessão pertencente ao usuário", () => {
  assert.deepEqual(validateInstagramSessionOwner({ userId: "user-a", profile: { id: "ig-a" } }, "user-a"), { ok: true, instagramUserId: "ig-a" });
});
