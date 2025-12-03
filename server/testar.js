import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const res = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Diga apenas: OK"
});

console.log(res.text);
