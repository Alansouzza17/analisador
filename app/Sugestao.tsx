import TopBar from "@/components/TopBar";
import { API_URL } from "@/services/api";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type AIResult = {
  avaliacao: string;
  publico: string;
  estilo: string;
  melhorias: string;
  legenda: string;
  hashtags: string;
};


export default function Sugestao() {
  const [image, setImage] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      setBase64(res.assets[0].base64 || null);
      setResult(null);
    }
  }

  async function analyzeImageWithAI() {
    if (!base64) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/ia/photo`
, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
         image: base64
        })

      });

      const data = await response.json();

      setResult(data);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#FEDA75", "#FA7E1E", "#D62976", "#962FBF", "#4F5BD5"]}
      style={styles.gradient}
    >
      <TopBar title="Sugestão de Post" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sugestão Inteligente</Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadText}>
            {image ? "Trocar imagem" : "Selecionar imagem"}
          </Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.imageCard}>
            <Image source={{ uri: image }} style={styles.preview} />
          </View>
        )}

        {image && !loading && (
          <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImageWithAI}>
            <Text style={styles.analyzeText}>Analisar com IA</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Analisando imagem...</Text>
          </View>
        )}

        {result && !loading && (
  <>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📸 Avaliação da Foto</Text>
      <Text style={styles.text}>{result.avaliacao}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>🎯 Público-alvo</Text>
      <Text style={styles.text}>{result.publico}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>🎨 Estilo Visual</Text>
      <Text style={styles.text}>{result.estilo}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>⚠️ Melhorias</Text>
      <Text style={styles.text}>{result.melhorias}</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>📝 Legenda</Text>
      <Text style={styles.text}>{result.legenda}</Text>
    </View>

    <View style={styles.card}>
  <Text style={styles.cardTitle}>🏷️ Hashtags</Text>
  <View style={styles.tagBox}>
    {(result?.hashtags ?? "")
      .toString()
      .split(/\s+/)
      .filter(Boolean)
      .map((tag, index) => (
        <Text key={index} style={styles.tag}>
          {tag}
        </Text>
      ))}
  </View>
</View>

  </>
)}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, paddingTop: 70 },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },

  uploadBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },

  uploadText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  imageCard: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 10,
    marginTop: 15,
  },

  preview: {
    width: "100%",
    height: 240,
    borderRadius: 14,
  },

  analyzeBtn: {
    backgroundColor: "#fff",
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  analyzeText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#333",
  },

  loadingBox: {
    marginTop: 20,
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    marginTop: 8,
    opacity: 0.85,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 16,
    marginTop: 14,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },

  text: {
    color: "#fff",
    fontSize: 15,
    opacity: 0.9,
  },

  tagBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  tag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 13,
  },
});
