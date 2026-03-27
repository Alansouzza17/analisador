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

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function evaluatePost(post) {
  let nota = 100;
  const flaws = [];

  if (post.media_type !== "VIDEO") {
    nota -= 10;
    flaws.push("Use mais vídeos");
  }

  const len = (post.caption || "").length;
  if (len < 30) {
    nota -= 15;
    flaws.push("Legenda muito curta");
  }
  if (len > 300) {
    nota -= 10;
    flaws.push("Legenda longa demais");
  }

  const days = Math.floor(
    (Date.now() - new Date(post.timestamp)) / (1000 * 60 * 60 * 24)
  );

  if (days > 20) {
    nota -= 20;
    flaws.push("Post antigo");
  }

  nota = Math.max(0, Math.min(100, nota));

  return {
    ...post,
    nota,
    dica: flaws.length ? flaws.join(", ") : "Post muito bom",
  };
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

async function getInstagramProfile() {
  const url = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${process.env.IG_TOKEN}`;
  const response = await fetch(url);
  const text = await response.text();

  if (!text.trim()) {
    throw new Error("Instagram retornou resposta vazia no perfil");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do Instagram no perfil: ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao buscar perfil do Instagram"
    );
  }

  return data;
}

async function getInstagramPosts() {
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${process.env.IG_TOKEN}`;
  const response = await fetch(url);
  const text = await response.text();

  console.log("Resposta bruta Instagram /posts:", text);

  if (!text.trim()) {
    throw new Error("Instagram retornou resposta vazia");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do Instagram nos posts: ${text}`);
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Erro ao buscar posts no Instagram"
    );
  }

  if (!data || !Array.isArray(data.data)) {
    throw new Error("Resposta inválida do Instagram: lista de posts ausente");
  }

  return data.data;
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Servidor rodando",
    port: PORT,
    baseUrl: BASE_URL,
  });
});

app.get("/instagram/profile", async (req, res) => {
  try {
    const data = await getInstagramProfile();
    return res.json(data);
  } catch (e) {
    console.error("Erro /instagram/profile:", e);
    return res.status(500).json({
      error: "Erro ao buscar perfil do Instagram",
      detalhes: e.message,
    });
  }
});

app.get("/instagram/posts", async (req, res) => {
  try {
    const posts = await getInstagramPosts();
    return res.json(posts);
  } catch (e) {
    console.error("Erro /instagram/posts:", e);
    return res.status(500).json({
      error: "Erro ao buscar posts",
      detalhes: e.message,
    });
  }
});

app.get("/ia/analyze", async (req, res) => {
  try {
    const posts = await getInstagramPosts();
    const metrics = buildMetrics(posts);
    const ranking = rankPosts(posts);
    const analiseIndividual = posts.map(evaluatePost);

    if (posts.length === 0) {
      return res.json({
        resumo: "Não há posts suficientes para análise.",
        pontosFortes: "Nenhum conteúdo encontrado.",
        pontosFracos: "Sem dados para avaliação.",
        sugestoes: "Publique conteúdos para que a IA possa analisar.",
        metricas: metrics,
      });
    }

    const prompt = `
Você é um especialista em marketing digital e Instagram Growth.

Baseado nos POSTS abaixo, faça uma auditoria completa.

POSTS:
${posts
  .map((p) => `- ${p.caption || "Sem legenda"} (${p.timestamp || "Sem data"})`)
  .join("\n")}

MÉTRICAS:
${JSON.stringify(metrics, null, 2)}

TAREFA:
Retorne SOMENTE em JSON válido no formato:

{
  "nicho": "qual o nicho do perfil",
  "score": 0,
  "bioSugerida": "bio profissional pronta",
  "resumo": "diagnóstico geral",
  "pontosFortes": "pontos positivos",
  "pontosFracos": "falhas do perfil",
  "sugestoes": "ações práticas"
}

REGRAS:
- Não escreva nada fora do JSON
- "score" deve ser entre 0 e 100
- A bio deve ser curta, clara e profissional
- O JSON deve ser válido
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = response.text || response.outputText || "";

    if (!rawText || !rawText.trim()) {
      throw new Error("Gemini retornou resposta vazia.");
    }

    console.log("Resposta bruta Gemini /ia/analyze:", rawText);

    const json = extractJsonFromText(rawText);

    json.metricas = metrics;
    json.ranking = ranking;
    json.posts = analiseIndividual;

    return res.json(json);
  } catch (error) {
    console.error("ERRO IA:", error);
    return res.status(500).json({
      resumo: "Erro ao analisar.",
      pontosFortes: "-",
      pontosFracos: "-",
      sugestoes: error.message || "Verifique backend e token.",
      metricas: buildMetrics([]),
    });
  }
});

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

    console.log("Resposta bruta Gemini /ia/photo:", raw);

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
   META / INSTAGRAM LOGIN - OAUTH FLOW
=========================================================== */

app.get("/auth/meta", (req, res) => {
  const redirectUri = encodeURIComponent(
    `${BASE_URL}/auth/meta/callback`
  );

  const url =
    `https://www.facebook.com/v23.0/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=pages_show_list,instagram_basic,business_management` +
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

    const tokenResponse = await fetch(tokenUrl);
    const tokenText = await tokenResponse.text();

    if (!tokenText.trim()) {
      return res.status(500).send("Resposta vazia ao trocar código por token");
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return res
        .status(500)
        .send(`Resposta inválida ao trocar código por token: ${tokenText}`);
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Erro token Meta:", tokenData);
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 40px;">
            <h2>Erro ao autenticar</h2>
            <pre style="text-align:left; display:inline-block; max-width:800px; white-space:pre-wrap;">
${JSON.stringify(tokenData, null, 2)}
            </pre>
          </body>
        </html>
      `);
    }

    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 40px;">
          <h2>Login realizado com sucesso</h2>
          <p>Token recebido com sucesso.</p>
          <pre style="text-align:left; display:inline-block; max-width:800px; white-space:pre-wrap;">
${JSON.stringify(tokenData, null, 2)}
          </pre>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Erro callback Meta:", error);
    return res.status(500).send("Erro no callback do Meta");
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em ${BASE_URL}`);
});