import assert from "node:assert/strict";
import test from "node:test";
import { comparePassword, createAccessToken, hashPassword, normalizeEmail, validatePassword, verifyAccessToken } from "./auth.js";

test("normaliza e-mail", () => assert.equal(normalizeEmail("  USER@Example.COM "), "user@example.com"));

test("valida tamanho mínimo de senha", () => {
  assert.equal(validatePassword("1234567"), false);
  assert.equal(validatePassword("12345678"), true);
});

test("hash de senha não armazena texto puro e pode ser validado", async () => {
  const hash = await hashPassword("senha-segura");
  assert.notEqual(hash, "senha-segura");
  assert.equal(await comparePassword("senha-segura", hash), true);
  assert.equal(await comparePassword("senha-errada", hash), false);
});

test("JWT criado usa o mesmo contrato de sessão", () => {
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "segredo-de-teste-com-tamanho-suficiente";
  try {
    const token = createAccessToken({ id: "user-1", email: "user@example.com" });
    const payload = verifyAccessToken(token);
    assert.equal(payload.sub, "user-1");
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
