import assert from "node:assert/strict";
import test from "node:test";
import { decryptInstagramToken, encryptInstagramToken, resolveInstagramToken } from "./token-crypto.js";

test("cifra token com AES-GCM sem manter texto puro", () => {
  const previous = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
  process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  try {
    const encrypted = encryptInstagramToken("token-secreto");
    assert.ok(encrypted.startsWith("v1:"));
    assert.equal(encrypted.includes("token-secreto"), false);
    assert.equal(decryptInstagramToken(encrypted), "token-secreto");
    assert.equal(resolveInstagramToken({ access_token_encrypted: encrypted, access_token: "encrypted:v1" }), "token-secreto");
  } finally {
    if (previous === undefined) delete process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY;
    else process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY = previous;
  }
});

test("mantém leitura compatível do token legado", () => {
  assert.equal(resolveInstagramToken({ access_token_encrypted: null, access_token: "legado" }), "legado");
});
