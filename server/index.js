import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/* ===============================
   INSTAGRAM BASIC - PERFIL
================================ */
app.get("/instagram/profile", async (req, res) => {
  try {
    const url = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${process.env.IG_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar perfil do Instagram" });
  }
});

/* ===============================
   INSTAGRAM BASIC - POSTS
================================ */
app.get("/instagram/posts", async (req, res) => {
  try {
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,timestamp&access_token=${process.env.IG_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.data);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

/* ===============================
   IA ANALYZE
================================ */
app.get("/ia/analyze", async (req, res) => {
  try {

    // 1 - Buscar posts reais
    const postsResponse = await fetch("http://localhost:3333/instagram/posts");
    const posts = await postsResponse.json();

    if (!posts || posts.length === 0) {
      return res.json({
        resumo: "Não há posts suficientes para análise.",
        pontosFortes: "Nenhum conteúdo encontrado.",
        pontosFracos: "Sem dados para avaliação.",
        sugestoes: "Publique conteúdos para que a IA possa analisar."
      });
    }

    // 2 - Montar prompt
    const prompt = `
Você está analisando um perfil REAL do Instagram.

POSTS:
${posts.map(p => `- ${p.caption || "Sem legenda"} (${p.timestamp})`).join("\n")}

Responda SOMENTE em JSON válido:

{
  "resumo": "resumo do perfil",
  "pontosFortes": "pontos fortes",
  "pontosFracos": "pontos fracos",
  "sugestoes": "sugestões"
}
`;

    // 3 - Chamar Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    // 4 - Converter JSON
    const text = response.text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const json = JSON.parse(text);

    // 5 - Enviar ao app
    res.json(json);

  } catch (error) {
    console.error("ERRO IA:", error);
    res.status(500).json({
      resumo: "Erro ao analisar.",
      pontosFortes: "-",
      pontosFracos: "-",
      sugestoes: "Verifique backend e token."
    });
  }
});

app.listen(3333, () => {
  console.log("🚀 Servidor rodando em http://localhost:3333");
});
