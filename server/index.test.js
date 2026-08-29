import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const PORT = 3347;
let server;

test.before(async () => {
  server = spawn(process.execPath, ["index.js"], {
    cwd: import.meta.dirname,
    env: {
      ...process.env,
      PORT: String(PORT),
      BASE_URL: `http://127.0.0.1:${PORT}`,
      CORS_ORIGIN: " http://localhost:8081 , https://analisador-nine.vercel.app/ ",
      CORS_ORIGINS: "",
      DATABASE_URL: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      APP_DEEP_LINK: "analisador://",
      INSTAGRAM_CLIENT_ID: "instagram-client-test",
    },
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

test("CORS aceita a origem web de produção configurada", async () => {
  const origin = "https://analisador-nine.vercel.app";
  const response = await fetch(`http://127.0.0.1:${PORT}/health`, {
    headers: { Origin: origin },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
});

test("CORS rejeita uma origem web não cadastrada sem derrubar o servidor", async () => {
  const response = await fetch(`http://127.0.0.1:${PORT}/health`, {
    headers: { Origin: "https://origem-nao-autorizada.example" },
  });

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "Origem não permitida pelo CORS" });
});

test("CORS responde ao preflight com métodos e headers usados pelo frontend", async () => {
  const origin = "https://analisador-nine.vercel.app";
  const response = await fetch(`http://127.0.0.1:${PORT}/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization,x-session-id",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.match(response.headers.get("access-control-allow-methods") || "", /PATCH/);
  assert.match(response.headers.get("access-control-allow-headers") || "", /Authorization/i);
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
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

test("Instagram rejeita redirect_back web fora da allowlist", async () => {
  const response = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent("https://site-malicioso.example")}`
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "redirect_back não autorizado" });
});

test("Instagram rejeita redirect_back relativo sem protocolo", async () => {
  const response = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent("analisador-nine.vercel.app")}`
  );

  assert.equal(response.status, 400);
});

test("Instagram cancelado na web retorna para a Vercel", async () => {
  const redirectBack = "https://analisador-nine.vercel.app";
  const loginResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent(redirectBack)}`
  );
  const { authUrl } = await loginResponse.json();
  const state = new URL(authUrl).searchParams.get("state");

  const callbackResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/callback?state=${state}&error=access_denied&error_description=${encodeURIComponent("Login cancelado")}`,
    { redirect: "manual" }
  );
  const location = new URL(callbackResponse.headers.get("location"));

  assert.equal(callbackResponse.status, 302);
  assert.equal(location.origin, redirectBack);
  assert.equal(location.searchParams.get("success"), "false");
  assert.equal(location.searchParams.get("error"), "Login cancelado");
});

test("Instagram com erro no mobile retorna para o deep link do app", async () => {
  const redirectBack = "analisador://";
  const loginResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent(redirectBack)}`
  );
  const { authUrl } = await loginResponse.json();
  const state = new URL(authUrl).searchParams.get("state");

  const callbackResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/callback?state=${state}&error=access_denied`,
    { redirect: "manual" }
  );
  const location = callbackResponse.headers.get("location");

  assert.equal(callbackResponse.status, 302);
  assert.match(location || "", /^analisador:\/\/\?/);
  assert.equal(new URL(location).searchParams.get("success"), "false");
});

test("OAuth state não pode ser reutilizado", async () => {
  const loginResponse = await fetch(
    `http://127.0.0.1:${PORT}/auth/app/instagram/login?redirect_back=${encodeURIComponent("analisador://")}`
  );
  const { authUrl } = await loginResponse.json();
  assert.equal(new URL(authUrl).origin, `http://127.0.0.1:${PORT}`);
  const state = new URL(authUrl).searchParams.get("state");

  const authorizeResponse = await fetch(authUrl, { redirect: "manual" });
  assert.equal(authorizeResponse.status, 302);
  assert.equal(
    new URL(authorizeResponse.headers.get("location")).origin,
    "https://www.instagram.com"
  );

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
