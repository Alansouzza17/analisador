import assert from "node:assert/strict";
import test from "node:test";
import {
  MemoryOneTimeStateStore,
  MemorySessionStore,
  PostgresOneTimeStateStore,
} from "./session-store.js";

test("cria e recupera uma sessão válida", async () => {
  const store = new MemorySessionStore({ ttlMs: 1_000 });
  const value = { accessToken: "fake-token" };
  const id = await store.create(value);

  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(await store.get(id), value);
});

test("retorna null para uma sessão inexistente", async () => {
  const store = new MemorySessionStore({ ttlMs: 1_000 });
  assert.equal(await store.get("inexistente"), null);
});

test("remove automaticamente uma sessão expirada", async () => {
  let now = 1_000;
  const store = new MemorySessionStore({ ttlMs: 100, now: () => now });
  const id = await store.create({ accessToken: "fake-token" });

  now = 1_101;
  assert.equal(await store.get(id), null);
});

test("refresh renova a expiração da sessão", async () => {
  let now = 1_000;
  const store = new MemorySessionStore({ ttlMs: 100, now: () => now });
  const id = await store.create({ accessToken: "fake-token" });

  now = 1_050;
  assert.equal(await store.refresh(id), true);
  now = 1_120;
  assert.notEqual(await store.get(id), null);
});

test("delete invalida a sessão usada pelo logout", async () => {
  const store = new MemorySessionStore({ ttlMs: 1_000 });
  const id = await store.create({ accessToken: "fake-token" });

  assert.equal(await store.delete(id), true);
  assert.equal(await store.get(id), null);
});

test("OAuth state é válido uma única vez", async () => {
  const store = new MemoryOneTimeStateStore({ ttlMs: 1_000 });
  const id = await store.create({ redirectBack: "analisador://instagram-auth" });

  assert.deepEqual(await store.consume(id), {
    redirectBack: "analisador://instagram-auth",
  });
  assert.equal(await store.consume(id), null);
});

test("OAuth state expirado é rejeitado", async () => {
  let now = 1_000;
  const store = new MemoryOneTimeStateStore({ ttlMs: 100, now: () => now });
  const id = await store.create({ redirectBack: "analisador://instagram-auth" });

  now = 1_101;
  assert.equal(await store.consume(id), null);
});

test("OAuth state persistente é criado e consumido atomicamente", async () => {
  const calls = [];
  const queryFn = async (text, params) => {
    calls.push({ text, params });
    if (text.includes("RETURNING value")) {
      return { rows: [{ value: { redirectBack: "https://app.example" } }] };
    }
    return { rows: [] };
  };
  const store = new PostgresOneTimeStateStore({ ttlMs: 1_000, queryFn });
  const id = await store.create({ redirectBack: "https://app.example" });

  assert.match(id, /^[0-9a-f-]{36}$/);
  assert.equal(calls[0].params[0], id);
  assert.equal(calls[0].params[1], JSON.stringify({ redirectBack: "https://app.example" }));
  assert.deepEqual(await store.consume(id), { redirectBack: "https://app.example" });
  assert.match(calls[1].text, /DELETE FROM oauth_states/);
  assert.match(calls[1].text, /expires_at > NOW\(\)/);
});
