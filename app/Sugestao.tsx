import { API_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AIResult = {
  avaliacao: string;
  publico: string;
  melhorUso: string;
  legenda: string;
  hashtags: string;
};

export default function Sugestao() {
  const router = useRouter();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);

  async function pickImage() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Permita acesso às fotos");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        setImage(asset.uri);

        const base64 = asset.base64 ?? undefined;
        analyzeImage(base64);
      }
    } catch (error) {
      console.log("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Erro ao selecionar imagem");
    }
  }

  async function takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Permita acesso à câmera");
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        base64: true,
      });

      if (!cameraResult.canceled && cameraResult.assets.length > 0) {
        const asset = cameraResult.assets[0];
        setImage(asset.uri);

        const base64 = asset.base64 ?? undefined;
        analyzeImage(base64);
      }
    } catch (error) {
      console.log("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Erro ao abrir câmera");
    }
  }

  async function analyzeImage(base64: string | undefined) {
    try {
      if (!base64) {
        Alert.alert("Erro", "Imagem inválida");
        return;
      }

      setLoading(true);
      setResult(null);

      const response = await fetch(`${API_URL}/ia/photo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${base64}`,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(text);
      }

      const data: AIResult = JSON.parse(text);
      setResult(data);
    } catch (error) {
      console.log("Erro IA:", error);
      Alert.alert("Erro", "Erro ao analisar imagem");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert("Copiado", `${label} copiado com sucesso`);
    } catch (error) {
      Alert.alert("Erro", `Não foi possível copiar ${label.toLowerCase()}`);
    }
  }

  function renderTagList(tags: string) {
    const items = tags
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.startsWith("#"));

    return (
      <View style={styles.tagsWrap}>
        {items.map((tag, index) => (
          <View key={`${tag}-${index}`} style={styles.tagChip}>
            <Text style={styles.tagChipText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>

              <View>
                <Text style={styles.headerTitle}>Sugestão de Post</Text>
                <Text style={styles.headerSubtitle}>
                  Analise sua imagem com IA
                </Text>
              </View>
            </View>

            <View style={styles.sparkleButton}>
              <Text style={styles.sparkleIcon}>✨</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard} onPress={takePhoto}>
              <View style={[styles.actionIconBox, { backgroundColor: "#EAF5EA" }]}>
                <Text style={styles.actionEmoji}>📷</Text>
              </View>
              <Text style={styles.actionTitle}>Tirar Foto</Text>
              <Text style={styles.actionSubtitle}>Capture agora</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={pickImage}>
              <View style={[styles.actionIconBox, { backgroundColor: "#F3E8FA" }]}>
                <Text style={styles.actionEmoji}>🖼️</Text>
              </View>
              <Text style={styles.actionTitle}>Galeria</Text>
              <Text style={styles.actionSubtitle}>Escolha uma imagem</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Preview da Imagem</Text>
            </View>

            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyPreviewIcon}>🖼️</Text>
                <Text style={styles.emptyPreviewText}>
                  Selecione uma imagem para analisar
                </Text>
              </View>
            )}
          </View>

          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#d62976" />
              <Text style={styles.loadingTitle}>Analisando com IA...</Text>
              <Text style={styles.loadingText}>
                Estamos avaliando sua imagem e gerando sugestões
              </Text>
            </View>
          )}

          {result && !loading && (
            <>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>⭐ Avaliação da Foto</Text>
                <Text style={styles.resultText}>{result.avaliacao}</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🎯 Público Ideal</Text>
                <Text style={styles.resultText}>{result.publico}</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🚀 Melhor Uso</Text>
                <Text style={styles.resultText}>{result.melhorUso}</Text>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.resultTitle}>✍️ Legenda Sugerida</Text>
                  <TouchableOpacity
                    onPress={() => copyText(result.legenda, "Legenda")}
                  >
                    <Text style={styles.copyText}>Copiar</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.resultText}>{result.legenda}</Text>
              </View>

              <View style={styles.resultCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.resultTitle}>#️⃣ Hashtags</Text>
                  <TouchableOpacity
                    onPress={() => copyText(result.hashtags, "Hashtags")}
                  >
                    <Text style={styles.copyText}>Copiar</Text>
                  </TouchableOpacity>
                </View>

                {renderTagList(result.hashtags)}
              </View>

              <TouchableOpacity style={styles.publishButton}>
                <LinearGradient
                  colors={["#d62976", "#962fbf", "#4f5bd5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.publishGradient}
                >
                  <Text style={styles.publishButtonText}>Publicar Agora</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F4F6",
  },

  header: {
    paddingBottom: 22,
  },

  headerContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  backButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#151515",
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#1F1F1F",
    opacity: 0.85,
  },

  sparkleButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  sparkleIcon: {
    fontSize: 28,
  },

  safe: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 34,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: "flex-start",
  },

  actionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  actionEmoji: {
    fontSize: 26,
  },

  actionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 6,
  },

  actionSubtitle: {
    fontSize: 13,
    color: "#707070",
    lineHeight: 18,
  },

  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  previewHeader: {
    marginBottom: 16,
  },

  previewTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D1D1D",
  },

  imagePreview: {
    width: "100%",
    height: 330,
    borderRadius: 24,
    resizeMode: "cover",
  },

  emptyPreview: {
    height: 260,
    borderRadius: 24,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#ECECEC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  emptyPreviewIcon: {
    fontSize: 36,
    marginBottom: 10,
  },

  emptyPreviewText: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
  },

  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  loadingTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
  },

  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  resultTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
    marginBottom: 12,
  },

  resultText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  copyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E1267D",
  },

  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },

  tagChip: {
    backgroundColor: "#F3E8FA",
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 10,
    marginBottom: 10,
  },

  tagChipText: {
    color: "#7B1FA2",
    fontWeight: "700",
    fontSize: 13,
  },

  publishButton: {
    marginTop: 4,
    borderRadius: 22,
    overflow: "hidden",
  },

  publishGradient: {
    paddingVertical: 18,
    alignItems: "center",
    borderRadius: 22,
  },

  publishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});