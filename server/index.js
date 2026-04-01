import { GoogleGenAI } from "@google/genai";
import bodyParser from "body-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

const PORT = process.env.PORT || 3333;
const HOST = "0.0.0.0";
const BASE_URL =
  process.env.BASE_URL || "https://analisador-api.onrender.com";
const APP_DEEP_LINK = process.env.APP_DEEP_LINK || "analisador://instagram-auth";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* ===========================================================
   SESSÕES
=========================================================== */

const sessions = new Map();

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

function ensureSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    throw new Error("Sessão inválida ou expirada");
  }

  return sessions.get(sessionId);
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

app.get("/", (req, res) => {
  return res.json({
    ok: true,
    message: "Servidor rodando",
    port: PORT,
    baseUrl: BASE_URL,
  });
});

/* ===========================================================
   INSTAGRAM FIXO
=========================================================== */

app.get("/instagram/profile", async (req, res) => {
  try {
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
    const posts = await getInstagramPostsFixed();
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

    if (!raw || !raw.trim()) {
      throw new Error("Gemini retornou resposta vazia.");
    }

    const json = extractJsonFromText(raw);

    return res.json({
      ...json,
      metricas: metrics,
    });
  } catch (error) {
    console.error("Erro /ia/analyze:", error);
    return res.status(500).json({
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
    console.error("Erro IA Foto:", error);
    return res.status(500).json({
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
          <pre style="text-align:left; display:inline-block; max-width:800px; white-space:pre-wrap;">
${JSON.stringify(tokenData, null, 2)}
          </pre>
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

app.get("/auth/app/instagram/login", (req, res) => {
  try {
    const redirectUri = encodeURIComponent(
      `${BASE_URL}/auth/app/instagram/callback`
    );

    const redirectBack =
      typeof req.query.redirect_back === "string" && req.query.redirect_back.trim()
        ? req.query.redirect_back.trim()
        : process.env.APP_DEEP_LINK;

    const url =
      `https://api.instagram.com/oauth/authorize` +
      `?client_id=${process.env.INSTAGRAM_CLIENT_ID}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments` +
      `&response_type=code` +
      `&state=${encodeURIComponent(redirectBack)}`;

    return res.json({ authUrl: url });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao gerar login do Instagram",
      detalhes: error.message,
    });
  }
});

app.get("/auth/app/instagram/callback", async (req, res) => {
  try {
    const { code, error, error_reason, error_description, state } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 30px; text-align: center;">
            <h2>Erro no login Instagram</h2>
            <p>${error_description || error_reason || "Login não autorizado"}</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 30px; text-align: center;">
            <h2>Código não recebido</h2>
          </body>
        </html>
      `);
    }

    const redirectUri = `${process.env.BASE_URL}/auth/app/instagram/callback`;

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
      return res.send(`
        <html>
          <body style="font-family: Arial; padding: 30px;">
            <h2>Erro ao obter token</h2>
            <pre>${JSON.stringify(tokenData, null, 2)}</pre>
          </body>
        </html>
      `);
    }

    const accessToken = tokenData.access_token;

    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );

    const profileData = await profileResponse.json();

    const sessionId = Math.random().toString(36).substring(2);

    return res.send(`
      <html>
        <body style="font-family: Arial; padding: 30px;">
          <h2>Login Instagram concluído com sucesso</h2>
          
          <h3>Session ID:</h3>
          <pre>${sessionId}</pre>

          <h3>Perfil:</h3>
          <pre>${JSON.stringify(profileData, null, 2)}</pre>

          <p>Agora sabemos que o login funcionou.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Erro login:", error);

    const redirectBack =
  typeof state === "string" && state.trim()
    ? state.trim()
    : "analisador://instagram-auth";

return res.redirect(
  `${redirectBack}?success=true&session_id=${encodeURIComponent(sessionId)}`
);
/* ===========================================================
   ROTAS INTERNAS - INSTAGRAM DO USUÁRIO LOGADO
=========================================================== */

app.get("/me/instagram/profile", async (req, res) => {
  try {
    const sessionId = getSessionIdFromReq(req);
    const session = ensureSession(sessionId);

    const data = await fetchJson(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url&access_token=${encodeURIComponent(session.accessToken)}`
    );

    session.profile = data;
    sessions.set(sessionId, session);

    return res.json(data);
  } catch (error) {
    console.error("Erro /me/instagram/profile:", error);

    return res.status(500).json({
      error: error.message || "Erro ao buscar perfil Instagram",
    });
  }
});

app.get("/me/instagram/media", async (req, res) => {
  try {
    const sessionId = getSessionIdFromReq(req);
    const session = ensureSession(sessionId);

    const data = await fetchJson(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${encodeURIComponent(session.accessToken)}`
    );

    session.media = Array.isArray(data?.data) ? data.data : [];
    sessions.set(sessionId, session);

    return res.json(data);
  } catch (error) {
    console.error("Erro /me/instagram/media:", error);

    return res.status(500).json({
      error: error.message || "Erro ao buscar posts do Instagram",
    });
  }
});

app.post("/auth/app/logout", (req, res) => {
  try {
    const sessionId = req.body?.session_id;

    if (sessionId) {
      sessions.delete(sessionId);
    }

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