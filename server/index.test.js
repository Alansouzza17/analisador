import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const PORT = 3347;
let server;

test.before(async () => {
  server = spawn(process.execPath, ["index.js"], {
    cwd: import.meta.dirname,
    env: { ...process.env, PORT: String(PORT), BASE_URL: `http://127.0.0.1:${PORT}` },
    stdio: ["ignore", "pipe", "pipe"],
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Servidor não iniciou")), 5000);
    server.once("error", reject);
    server.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("Servidor rodando")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
});

test.after(() => server?.kill());

test("health check responde com sucesso", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test("cadastro informa quando o banco ainda não foi configurado", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Teste", email: "teste@example.com", password: "senha-segura" }),
  });
  assert.equal(response.status, 503);
});

test("Google informa configuração ausente sem iniciar OAuth incompleto", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/auth/google/login?redirect_back=analisador%3A%2F%2Fgoogle-auth`);
  assert.equal(response.status, 503);
});

test("endpoint de IA rejeita requisição sem sessão", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/ia/photo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image: "abc" }),
  });

  assert.equal(response.status, 401);
});

test("perfil protegido retorna contrato JSON e 401 sem sessão", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/me/instagram/profile`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(typeof body.error, "string");
});

test("OAuth state inválido é rejeitado", async () => {
  const response = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/callback?state=invalido&error=denied`,
    { redirect: "manual" }
  );
  assert.equal(response.status, 400);
});

test("OAuth state não pode ser reutilizado", async () => {
  const loginResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent("analisador://instagram-auth")}`
  );
  const { authUrl } = await loginResponse.json();
  assert.equal(new URL(authUrl).origin, "https://www.instagram.com");
  const state = new URL(authUrl).searchParams.get("state");

  const first = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/callback?state=${state}&error=denied`,
    { redirect: "manual" }
  );
  const second = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/callback?state=${state}&error=denied`,
    { redirect: "manual" }
  );

  assert.equal(first.status, 302);
  assert.equal(second.status, 400);
});

test("logout aceita sessão inexistente sem expor informação", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/auth/app/logout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ session_id: "inexistente" }),
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
});

test("endpoints legados ficam desabilitados por padrão", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/instagram/profile`);
  assert.equal(response.status, 404);
});
