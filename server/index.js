import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import {
  bearerToken,
  comparePassword,
  consumePasswordReset,
  createAccessToken,
  hashPassword,
  issuePasswordReset,
  normalizeEmail,
  publicUser,
  requireUser,
  validatePassword,
  verifyAccessToken,
} from "./auth.js";
import { query } from "./db.js";
import { MemoryOneTimeStateStore, MemorySessionStore } from "./session-store.js";

const PORT = process.env.PORT || 3333;
const HOST = "0.0.0.0";
const BASE_URL =
  process.env.BASE_URL || "https://analisador-api.onrender.com";
const APP_DEEP_LINK = process.env.APP_DEEP_LINK || "analisador://instagram-auth";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

const app = express();

function normalizeOrigin(origin) {
  const value = origin.trim().replace(/\/+$/, "");
  if (!value) return "";

  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

const allowedOrigins = new Set(
  [process.env.CORS_ORIGIN, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean)
);

function isOriginAllowed(origin) {
  return !origin || allowedOrigins.has(normalizeOrigin(origin));
}

function validateInstagramRedirectBack(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const redirectUrl = new URL(value.trim());
    if (redirectUrl.username || redirectUrl.password || redirectUrl.search || redirectUrl.hash) {
      return null;
    }

    if (redirectUrl.protocol === "http:" || redirectUrl.protocol === "https:") {
      if (!allowedOrigins.has(redirectUrl.origin)) return null;
      const pathname = redirectUrl.pathname.replace(/\/+$/, "");
      return `${redirectUrl.origin}${pathname}`;
    }

    const mobileRedirectUrl = new URL(APP_DEEP_LINK);
    const mobileRootRedirect = `${mobileRedirectUrl.protocol}//`;
    if (redirectUrl.href === mobileRootRedirect) return mobileRootRedirect;
    return redirectUrl.href === mobileRedirectUrl.href ? mobileRedirectUrl.href : null;
  } catch {
    return null;
  }
}

function instagramRedirectUrl(redirectBack, params) {
  return `${redirectBack}?${new URLSearchParams(params)}`;
}

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (isOriginAllowed(origin)) return next();
  return res.status(403).json({ error: "Origem não permitida pelo CORS" });
});

app.use(
  cors({
    origin(origin, callback) {
      return callback(null, isOriginAllowed(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-id"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "20mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const sessionStoreDriver = process.env.SESSION_STORE || "memory";
if (sessionStoreDriver !== "memory") {
  throw new Error(`SESSION_STORE não suportado: ${sessionStoreDriver}`);
}
const sessionStore = new MemorySessionStore({ ttlMs: SESSION_TTL_MS });
const oauthStateStore = new MemoryOneTimeStateStore({ ttlMs: OAUTH_STATE_TTL_MS });

/* ===========================================================
   HELPERS
=========================================================== */

function extractJsonFromText(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error("A IA retornou resposta vazia.");
  }

  const cleaned = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Resposta da IA sem JSON válido: ${cleaned}`);
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function postScore(post) {
  let score = post.media_type === "VIDEO" ? 30 : 20;

  const len = (post.caption || "").length;
  if (len > 160) score += 20;
  else if (len > 80) score += 10;
  else if (len < 20) score -= 10;

  const days = Math.floor(
    (Date.now() - new Date(post.timestamp)) / (1000 * 60 * 60 * 24)
  );

  if (days <= 3) score += 20;
  else if (days <= 7) score += 10;
  else if (days > 30) score -= 15;

  return { score, days };
}

function rankPosts(posts = []) {
  return posts
    .map((p) => {
      const { score, days } = postScore(p);

      const why = [];
      if (p.media_type === "VIDEO") why.push("vídeo");
      if ((p.caption || "").length > 120) why.push("boa legenda");
      if (days <= 7) why.push("recente");
      if ((p.caption || "").length < 20) why.push("legenda curta");
      if (days > 30) why.push("antigo");

      return {
        ...p,
        rankingScore: score,
        justificativa: why.join(", ") || "neutro",
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

function buildMetrics(posts = []) {
  const now = new Date();

  const dates = posts
    .filter((p) => p.timestamp)
    .map((p) => new Date(p.timestamp))
    .sort((a, b) => b - a);

  let avgGapDays = 0;
  if (dates.length > 1) {
    const diffs = dates
      .slice(0, dates.length - 1)
      .map((d, i) => (d - dates[i + 1]) / (1000 * 60 * 60 * 24));

    avgGapDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  const lastPostDays = dates.length
    ? Math.floor((now - dates[0]) / (1000 * 60 * 60 * 24))
    : null;

  const captions = posts.map((p) => (p.caption || "").trim());
  const avgCaption = captions.length
    ? Math.round(
        captions.reduce((a, c) => a + c.length, 0) / captions.length
      )
    : 0;

  const types = {};
  posts.forEach((p) => {
    const tipo = p.media_type || "DESCONHECIDO";
    types[tipo] = (types[tipo] || 0) + 1;
  });

  let score = 100;

  if (avgGapDays > 10) score -= 25;
  else if (avgGapDays > 5) score -= 15;
  else if (avgGapDays > 3) score -= 5;

  if (avgCaption < 50) score -= 10;
  if (Object.keys(types).length <= 1 && posts.length > 0) score -= 10;
  if (lastPostDays !== null && lastPostDays > 14) score -= 15;

  score = Math.max(0, Math.min(100, score));

  return {
    freqMediaDias: Math.round(avgGapDays || 0),
    diasDesdeUltimoPost: lastPostDays,
    mediaCaracteresLegenda: avgCaption,
    tiposDeMidia: types,
    score,
  };
}

function getAccessTokenFromReq(req) {
  const queryToken = req.query.access_token?.trim();
  const headerToken = req.headers.authorization
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  return headerToken || queryToken || null;
}

function getSessionIdFromReq(req) {
  const querySession = typeof req.query.session_id === "string"
    ? req.query.session_id.trim()
    : null;

  const headerSession = req.headers["x-session-id"];
  const normalizedHeaderSession =
    typeof headerSession === "string" ? headerSession.trim() : null;

  return querySession || normalizedHeaderSession || null;
}

async function ensureSession(sessionId) {
  const session = await sessionStore.get(sessionId);
  if (!session) {
    throw new Error("Sessão inválida ou expirada");
  }

  return session;
}

function isSessionError(error) {
  return error instanceof Error && error.message === "Sessão inválida ou expirada";
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  if (!text.trim()) {
    throw new Error("Resposta vazia da API externa.");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida da API externa: ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error_message ||
        data?.error_type ||
        "Erro na API externa"
    );
  }

  return data;
}

/* ===========================================================
   INSTAGRAM FIXO (MODO ANTIGO / MVP)
=========================================================== */

async function getInstagramProfileFixed() {
  if (!process.env.IG_TOKEN) {
    throw new Error("IG_TOKEN não configurado");
  }

  const url =
    `https://graph.instagram.com/me` +
    `?fields=id,username,account_type,media_count` +
    `&access_token=${encodeURIComponent(process.env.IG_TOKEN)}`;

  return fetchJson(url);
}

async function getInstagramPostsFixed() {
  if (!process.env.IG_TOKEN) {
    throw new Error("IG_TOKEN não configurado");
  }

  const url =
    `https://graph.instagram.com/me/media` +
    `?fields=id,caption,media_type,media_url,timestamp` +
    `&access_token=${encodeURIComponent(process.env.IG_TOKEN)}`;

  const data = await fetchJson(url);

  if (!data || !Array.isArray(data.data)) {
    throw new Error("Resposta inválida do Instagram: lista de posts ausente");
  }

  return data.data;
}

/* ===========================================================
   HEALTH
=========================================================== */

function healthResponse(req, res) {
  return res.json({
    ok: true,
    message: "Servidor rodando",
    port: PORT,
    baseUrl: BASE_URL,
  });
}

function authResponse(user) {
  return { user: publicUser(user), accessToken: createAccessToken(user) };
}

function databaseError(res, error) {
  if (error?.code === "DATABASE_NOT_CONFIGURED") {
    return res.status(503).json({ error: "Banco de dados não configurado" });
  }
  console.error("Erro de autenticação:", error);
  return res.status(500).json({ error: "Não foi possível concluir a autenticação" });
}

async function sendPasswordResetEmail(email, token) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return false;
  const resetBase = process.env.RESET_URL_BASE || "analisador://redefinir-senha";
  const resetUrl = `${resetBase}${resetBase.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
  await fetchJson("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Redefina sua senha do Analisador",
      html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl}">Criar nova senha</a></p><p>Este link expira em 30 minutos.</p>`,
    }),
  });
  return true;
}

/* ===========================================================
   AUTENTICAÇÃO DO USUÁRIO
=========================================================== */

app.post("/auth/register", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (name.length < 2 || !email.includes("@") || !validatePassword(password)) {
      return res.status(400).json({ error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres" });
    }
    const passwordHash = await hashPassword(password);
    const result = await query(
      `INSERT INTO users (id, name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar_url`,
      [randomUUID(), name, email, passwordHash]
    );
    return res.status(201).json(authResponse(result.rows[0]));
  } catch (error) {
    if (error?.code === "23505") return res.status(409).json({ error: "Este e-mail já está cadastrado" });
    return databaseError(res, error);
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    if (!email || typeof password !== "string") return res.status(400).json({ error: "Informe e-mail e senha" });
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return res.status(401).json({ error: "E-mail ou senha incorretos" });
    }
    return res.json(authResponse(user));
  } catch (error) {
    return databaseError(res, error);
  }
});

app.get("/auth/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

app.post("/auth/logout", (_req, res) => res.json({ success: true }));

app.post("/auth/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (email) {
      const result = await query("SELECT id FROM users WHERE email = $1", [email]);
      if (result.rows[0]) {
        const token = await issuePasswordReset(result.rows[0].id);
        await sendPasswordResetEmail(email, token);
        if (process.env.RESET_TOKEN_LOG === "true") console.log(`Token de recuperação para ${email}: ${token}`);
      }
    }
    return res.json({ message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." });
  } catch (error) {
    return databaseError(res, error);
  }
});

app.post("/auth/reset-password", async (req, res) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const password = req.body?.password;
    if (!token || !validatePassword(password)) return res.status(400).json({ error: "Token e nova senha com pelo menos 8 caracteres são obrigatórios" });
    const changed = await consumePasswordReset(token, await hashPassword(password));
    if (!changed) return res.status(400).json({ error: "Token inválido ou expirado" });
    return res.json({ success: true });
  } catch (error) {
    return databaseError(res, error);
  }
});

app.get("/auth/google/login", async (req, res) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ error: "Login com Google não configurado" });
    }
    const redirectBack = typeof req.query.redirect_back === "string" ? req.query.redirect_back.trim() : "";
    if (!redirectBack) return res.status(400).json({ error: "redirect_back é obrigatório" });
    const state = await oauthStateStore.create({ redirectBack, provider: "google" });
    const redirectUri = `${BASE_URL}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });
    return res.json({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  } catch (error) {
    return databaseError(res, error);
  }
});

app.get("/auth/google/callback", async (req, res) => {
  const oauthState = await oauthStateStore.consume(req.query.state);
  const redirectBack = oauthState?.provider === "google" ? oauthState.redirectBack : null;
  if (!redirectBack) return res.status(400).json({ error: "Estado OAuth inválido ou expirado" });
  if (req.query.error || !req.query.code) {
    return res.redirect(`${redirectBack}?provider=google&success=false&error=${encodeURIComponent(req.query.error || "Código não recebido")}`);
  }
  try {
    const tokenData = await fetchJson("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(req.query.code),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const googleUser = await fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokenData.access_token}` },
    });
    const email = normalizeEmail(googleUser.email);
    const result = await query(
      `INSERT INTO users (id, name, email, google_id, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         google_id = COALESCE(users.google_id, EXCLUDED.google_id),
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url), updated_at = NOW()
       RETURNING id, name, email, avatar_url`,
      [randomUUID(), googleUser.name || email.split("@")[0], email, googleUser.sub, googleUser.picture || null]
    );
    const exchangeCode = await oauthStateStore.create({ provider: "google_exchange", accessToken: createAccessToken(result.rows[0]) });
    return res.redirect(`${redirectBack}?provider=google&success=true&auth_code=${encodeURIComponent(exchangeCode)}`);
  } catch (error) {
    console.error("Erro OAuth Google:", error);
    return res.redirect(`${redirectBack}?provider=google&success=false&error=${encodeURIComponent("Não foi possível entrar com Google")}`);
  }
});

app.post("/auth/google/exchange", async (req, res) => {
  const exchange = await oauthStateStore.consume(req.body?.code);
  if (exchange?.provider !== "google_exchange" || !exchange.accessToken) {
    return res.status(400).json({ error: "Código de autenticação inválido ou expirado" });
  }
  return res.json({ accessToken: exchange.accessToken });
});

app.get("/", healthResponse);
app.get("/health", healthResponse);

/* ===========================================================
   INSTAGRAM FIXO
=========================================================== */

app.get("/instagram/profile", async (req, res) => {
  try {
    if (process.env.ENABLE_LEGACY_IG_ENDPOINTS !== "true") {
      return res.status(404).json({ error: "Rota desabilitada" });
    }
    const data = await getInstagramProfileFixed();
    return res.json(data);
  } catch (error) {
    console.error("Erro /instagram/profile:", error);
    return res.status(500).json({
      error: "Erro ao buscar perfil do Instagram",
      detalhes: error.message,
    });
  }
});

app.get("/instagram/posts", async (req, res) => {
  try {
    if (process.env.ENABLE_LEGACY_IG_ENDPOINTS !== "true") {
      return res.status(404).json({ error: "Rota desabilitada" });
    }
    const posts = await getInstagramPostsFixed();
    return res.json(posts);
  } catch (error) {
    console.error("Erro /instagram/posts:", error);
    return res.status(500).json({
      error: "Erro ao buscar posts do Instagram",
      detalhes: error.message,
    });
  }
});

/* ===========================================================
   IA - ANÁLISE DO PERFIL
=========================================================== */

app.get("/ia/analyze", async (req, res) => {
  try {
    const session = await ensureSession(getSessionIdFromReq(req));

    const postsResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${encodeURIComponent(session.accessToken)}`
    );

    const postsData = await postsResponse.json();

    if (!postsResponse.ok || !Array.isArray(postsData?.data)) {
      throw new Error(postsData?.error?.message || "Erro ao buscar posts");
    }

    const posts = postsData.data;
    const rankedPosts = rankPosts(posts);
    const metrics = buildMetrics(posts);

    const prompt = `
Você é um especialista em crescimento no Instagram.

Analise os posts abaixo e retorne SOMENTE JSON válido com esta estrutura:

{
  "resumo": "resumo geral",
  "pontosFortes": ["ponto 1", "ponto 2"],
  "pontosFracos": ["ponto 1", "ponto 2"],
  "sugestoes": ["sugestão 1", "sugestão 2"],
  "bioSugerida": "bio sugerida",
  "score": 0
}

Métricas calculadas:
${JSON.stringify(metrics, null, 2)}

Posts:
${JSON.stringify(rankedPosts.slice(0, 12), null, 2)}

Regras:
- Responda apenas JSON válido
- Não escreva markdown
- O campo "score" deve ser um número entre 0 e 100
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });

    const raw = response.text || response.outputText || "";
    const json = extractJsonFromText(raw);

    return res.json({
      ...json,
      metricas: metrics,
    });
  } catch (error) {
    if (!isSessionError(error)) console.error("Erro /ia/analyze:", error);
    return res.status(isSessionError(error) ? 401 : 500).json({
      error: "Falha na análise da IA",
      detalhes: error.message,
      metricas: buildMetrics([]),
    });
  }
});

/* ===========================================================
   IA - ANÁLISE DE FOTO
=========================================================== */

app.post("/ia/photo", async (req, res) => {
  try {
    await ensureSession(getSessionIdFromReq(req));
    const image = req.body?.image;

    if (!image) {
      return res.status(400).json({ error: "Imagem não enviada" });
    }

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    if (!base64) {
      return res.status(400).json({ error: "Imagem inválida" });
    }

    const promptFoto = `
Você é um social media profissional especializado em Instagram.

Analise esta imagem como post e retorne SOMENTE em JSON válido:

{
  "avaliacao": "avaliação geral da imagem",
  "publico": "público ideal",
  "melhorUso": "feed, story, reels, anúncio etc",
  "legenda": "legenda sugerida",
  "hashtags": "#hashtags"
}

Regras:
- Não escreva texto fora do JSON
- Apenas JSON válido
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: promptFoto },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64,
              },
            },
          ],
        },
      ],
    });

    const raw = response.text || response.outputText || "";

    if (!raw || !raw.trim()) {
      throw new Error("Gemini retornou resposta vazia na análise da foto.");
    }

    const json = extractJsonFromText(raw);
    return res.json(json);
  } catch (error) {
    if (!isSessionError(error)) console.error("Erro IA Foto:", error);
    return res.status(isSessionError(error) ? 401 : 500).json({
      error: "Falha IA de foto",
      detalhes: error.message,
    });
  }
});

/* ===========================================================
   META / FACEBOOK LOGIN (LEGADO)
=========================================================== */

app.get("/auth/meta", (req, res) => {
  const redirectUri = encodeURIComponent(`${BASE_URL}/auth/meta/callback`);

  const url =
    `https://www.facebook.com/v23.0/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=public_profile,pages_show_list,instagram_basic,business_management` +
    `&response_type=code`;

  return res.redirect(url);
});

app.get("/auth/meta/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Código não recebido");
    }

    const redirectUri = `${BASE_URL}/auth/meta/callback`;

    const tokenUrl =
      `https://graph.facebook.com/v23.0/oauth/access_token` +
      `?client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`;

    const tokenData = await fetchJson(tokenUrl);

    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h2>Login realizado com sucesso</h2>
          <p>Você já pode voltar para o app.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Erro callback Meta:", error);
    return res.status(500).json({
      error: "Erro no callback do Meta",
      detalhes: error.message,
    });
  }
});

app.get("/auth/meta/test-user", async (req, res) => {
  try {
    const accessToken = getAccessTokenFromReq(req);

    if (!accessToken) {
      return res.status(400).json({ error: "access_token é obrigatório" });
    }

    const data = await fetchJson(
      `https://graph.facebook.com/v23.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
    );

    return res.json(data);
  } catch (error) {
    console.error("Erro ao buscar usuário Meta:", error);
    return res.status(500).json({
      error: "Erro ao buscar usuário Meta",
      detalhes: error.message,
    });
  }
});

/* ===========================================================
   LOGIN INSTAGRAM APP
=========================================================== */

app.get("/auth/app/instagram/login", async (req, res) => {
  try {
    const requestedRedirectBack =
      typeof req.query.redirect_back === "string" && req.query.redirect_back.trim()
        ? req.query.redirect_back.trim()
        : APP_DEEP_LINK;
    const redirectBack = validateInstagramRedirectBack(requestedRedirectBack);

    if (!redirectBack) {
      return res.status(400).json({ error: "redirect_back não autorizado" });
    }

    let userId = null;
    const authToken = bearerToken(req);
    if (authToken) {
      try {
        userId = verifyAccessToken(authToken).sub;
      } catch {
        return res.status(401).json({ error: "Sessão de usuário inválida ou expirada" });
      }
    }

    const state = await oauthStateStore.create({ redirectBack, provider: "instagram", userId });

    const url = `${BASE_URL}/auth/app/instagram/authorize?state=${encodeURIComponent(state)}`;

    return res.json({ authUrl: url });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao gerar login do Instagram",
      detalhes: error.message,
    });
  }
});

// Abre primeiro o domínio da API para evitar que o Safari trate o clique
// inicial como Universal Link direto para o aplicativo do Instagram.
app.get("/auth/app/instagram/authorize", (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state.trim() : "";
  if (!state) return res.status(400).json({ error: "Estado OAuth obrigatório" });
  if (!process.env.INSTAGRAM_CLIENT_ID) {
    return res.status(503).json({ error: "Login do Instagram não configurado" });
  }

  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    redirect_uri: `${BASE_URL}/auth/app/instagram/callback`,
    scope: "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
    response_type: "code",
    state,
    force_reauth: "true",
  });

  return res.redirect(302, `https://www.instagram.com/oauth/authorize?${params}`);
});

app.get("/auth/app/instagram/callback", async (req, res) => {
  let redirectBack = APP_DEEP_LINK;

  try {
    const { code, error, error_reason, error_description, state } = req.query;

    const oauthState = await oauthStateStore.consume(state);
    redirectBack = oauthState?.provider === "instagram" ? oauthState.redirectBack : null;

    if (!redirectBack) {
      return res.status(400).json({ error: "Estado OAuth inválido ou expirado" });
    }

    if (error) {
      return res.redirect(instagramRedirectUrl(redirectBack, {
        success: "false",
        error: error_description || error_reason || "Login não autorizado",
      }));
    }

    if (!code) {
      return res.redirect(instagramRedirectUrl(redirectBack, {
        success: "false",
        error: "Código não recebido",
      }));
    }

    const redirectUri = `${BASE_URL}/auth/app/instagram/callback`;

    const form = new URLSearchParams();
    form.append("client_id", process.env.INSTAGRAM_CLIENT_ID);
    form.append("client_secret", process.env.INSTAGRAM_CLIENT_SECRET);
    form.append("grant_type", "authorization_code");
    form.append("redirect_uri", redirectUri);
    form.append("code", code);

    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body: form,
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.redirect(instagramRedirectUrl(redirectBack, {
        success: "false",
        error: tokenData?.error_message || tokenData?.error_type || "Erro ao obter token",
      }));
    }

    const accessToken = tokenData.access_token;

    const profileResponse = await fetch(
  `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
);

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      return res.redirect(instagramRedirectUrl(redirectBack, {
        success: "false",
        error: profileData?.error?.message || "Erro ao buscar perfil",
      }));
    }

    const sessionId = await sessionStore.create({
      accessToken,
      profile: profileData,
      userId: oauthState.userId || null,
    });

    if (oauthState.userId) {
      await query(
        `INSERT INTO instagram_accounts
          (id, user_id, instagram_user_id, username, access_token)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, instagram_user_id) DO UPDATE SET
          username = EXCLUDED.username, access_token = EXCLUDED.access_token, updated_at = NOW()`,
        [randomUUID(), oauthState.userId, String(profileData.id), profileData.username || "instagram", accessToken]
      );
    }

    return res.redirect(instagramRedirectUrl(redirectBack, {
      success: "true",
      session_id: sessionId,
      user_id: profileData.id || "",
      username: profileData.username || "",
      profile_picture_url: profileData.profile_picture_url || "",
    }));
  } catch (error) {
    console.error("Erro login:", error);

    return res.redirect(instagramRedirectUrl(redirectBack || APP_DEEP_LINK, {
      success: "false",
      error: error.message || "Erro no callback",
    }));
  }
});
/* ===========================================================
   ROTAS INTERNAS - INSTAGRAM DO USUÁRIO LOGADO
=========================================================== */

app.get("/me/instagram/profile", async (req, res) => {
  try {
    const session = await ensureSession(getSessionIdFromReq(req));

    const response = await fetch(
  `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url&access_token=${encodeURIComponent(session.accessToken)}`
);

    const data = await response.json();

    return res.status(response.ok ? 200 : 400).json(data);
  } catch (error) {
    if (!isSessionError(error)) console.error("Erro /me/instagram/profile:", error);

    return res.status(isSessionError(error) ? 401 : 500).json({
      error: "Erro ao buscar perfil Instagram",
    });
  }
});

app.get("/me/instagram/media", async (req, res) => {
  try {
    const session = await ensureSession(getSessionIdFromReq(req));

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${encodeURIComponent(session.accessToken)}`
    );

    const data = await response.json();

    return res.status(response.ok ? 200 : 400).json(data);
  } catch (error) {
    if (!isSessionError(error)) console.error("Erro /me/instagram/media:", error);

    return res.status(isSessionError(error) ? 401 : 500).json({
      error: "Erro ao buscar posts do Instagram",
    });
  }
});

app.post("/auth/app/logout", async (req, res) => {
  try {
    const sessionId = req.body?.session_id;

    if (sessionId) await sessionStore.delete(sessionId);

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao encerrar sessão",
      detalhes: error.message,
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em ${BASE_URL}`);
});
