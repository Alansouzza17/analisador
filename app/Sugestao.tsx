import TopBar from "@/components/TopBar";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AIResult = {
  melhor: string;
  legenda: string;
  hashtags: string;
};

const API_URL = "http://192.168.1.17:3333";

export default function Sugestao() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
      base64: true
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setResult(null);

      const base64 = res.assets[0].base64;

if (base64) {
  analyzeImageWithAI(base64);
} else {
  alert("Erro ao carregar imagem.");
}

    }
  }

  async function analyzeImageWithAI(base64Image?: string) {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/ia/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            username: "meuperfil"
          },
          posts: [
            {
              image: base64Image,
              caption: "Foto enviada pelo usuário"
            }
          ]
        })
      });

      const data = await response.json();

      // simples parse da resposta da IA
      setResult({
        melhor: data.analysis || "Boa composição e iluminação.",
        legenda: "Aproveitando o momento ✨",
        hashtags: "#insta #foto #trend"
      });

    } catch (error) {
      console.error(error);
      setResult({
        melhor: "Erro ao analisar imagem.",
        legenda: "Tente novamente.",
        hashtags: "-"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#FEDA75", "#FA7E1E", "#D62976", "#962FBF", "#4F5BD5"]}
      style={styles.gradient}
    >
      <TopBar title="Postagem" />
      
      <View style={styles.container}>
        <Text style={styles.title}>Sugestão de Post</Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadText}>
            {image ? "Trocar Foto" : "Enviar Foto"}
          </Text>
        </TouchableOpacity>

        {image && <Image source={{ uri: image }} style={styles.preview} />}

        {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

        {result && !loading && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>📊 Sua melhor opção</Text>
            <Text style={styles.resultText}>{result.melhor}</Text>

            <Text style={styles.resultTitle}>📝 Legenda sugerida</Text>
            <Text style={styles.resultText}>{result.legenda}</Text>

            <Text style={styles.resultTitle}>🏷️ Hashtags ideais</Text>
            <Text style={styles.resultText}>{result.hashtags}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingTop: 70 },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  uploadBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },

  uploadText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  preview: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    marginVertical: 20,
  },

  resultBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
  },

  resultTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  resultText: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 15,
    marginTop: 4,
  },
});
