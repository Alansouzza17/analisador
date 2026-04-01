import ExpandableText from "@/components/ExpandableText";
import { API_URL } from "@/services/api";
import { getActiveSessionId } from "@/services/session";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

type IAResponse = {
  nicho?: string;
  score: number;
  bioSugerida: string;
  resumo: string;
  pontosFortes: string[] | string;
  pontosFracos: string[] | string;
  sugestoes: string[] | string;
  username?: string;
  metricas?: {
    freqMediaDias?: number;
    diasDesdeUltimoPost?: number | null;
    mediaCaracteresLegenda?: number;
    tiposDeMidia?: Record<string, number>;
  };
};

type InstagramProfile = {
  id: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
};

const ANALYSIS_STORAGE_KEY = "@last_profile_analysis";

export default function Analysis() {
  const router = useRouter();

  const [result, setResult] = useState<IAResponse | null>(null);
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    carregarUltimaAnalise();
    carregarPerfil();
  }, []);

  async function getSessionId() {
  return await getActiveSessionId();
}

  async function carregarUltimaAnalise() {
    try {
      const saved = await AsyncStorage.getItem(ANALYSIS_STORAGE_KEY);

      if (saved) {
        const parsed: IAResponse = JSON.parse(saved);
        setResult(parsed);
      }
    } catch (error) {
      console.log("Erro ao carregar última análise:", error);
    } finally {
      setLoadingSaved(false);
    }
  }

  async function carregarPerfil() {
  try {
    setLoadingProfile(true);

    const sessionId = await getSessionId();

    const response = await fetch(
      `${API_URL}/me/instagram/profile?session_id=${sessionId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Erro ao carregar perfil");
    }

    setProfile(data);
  } catch (error) {
    console.log("Erro ao carregar perfil:", error);
  } finally {
    setLoadingProfile(false);
  }
}

async function analisarPerfil() {
  try {
    setLoadingIA(true);
    setError("");

    const sessionId = await getSessionId();

    const response = await fetch(
      `${API_URL}/ia/analyze?session_id=${sessionId}`
    );

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text);
    }

    const data: IAResponse = JSON.parse(text);

    setResult(data);
    await AsyncStorage.setItem(
      ANALYSIS_STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (e) {
    console.log("Erro ao analisar perfil:", e);
    setError("Erro ao analisar perfil");
  } finally {
    setLoadingIA(false);
  }
}

  function cleanMarkdown(text: string) {
    return text.replace(/\*\*/g, "").replace(/#/g, "");
  }

  function formatText(content: string[] | string | undefined) {
    if (!content) return "Não disponível";

    if (Array.isArray(content)) {
      return content.map((item) => `• ${cleanMarkdown(item)}`).join("\n\n");
    }

    return cleanMarkdown(content);
  }

  async function copiarBio() {
    if (!result?.bioSugerida) return;

    try {
      await Clipboard.setStringAsync(cleanMarkdown(result.bioSugerida));
      Alert.alert("Copiado", "Bio copiada com sucesso.");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível copiar a bio.");
    }
  }

  const usernameExibicao = profile?.username || result?.username || "Instagram";
  const avatarExibicao =
    profile?.profile_picture_url || require("../assets/images/perfil.png");

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
                <Text style={styles.headerTitle}>Análise do Perfil</Text>
                <Text style={styles.headerSubtitle}>@{usernameExibicao}</Text>
              </View>
            </View>

            {typeof avatarExibicao === "string" ? (
              <Image
                source={{ uri: avatarExibicao }}
                style={styles.headerAvatar}
              />
            ) : (
              <Image source={avatarExibicao} style={styles.headerAvatar} />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {(loadingSaved || loadingProfile) && !result ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#d62976" />
              <Text style={styles.loadingText}>Carregando análise...</Text>
            </View>
          ) : null}

          {!loadingSaved && !result && !loadingIA && (
            <TouchableOpacity
              style={styles.analyzeButton}
              onPress={analisarPerfil}
            >
              <Text style={styles.analyzeButtonText}>Analisar Perfil Agora</Text>
            </TouchableOpacity>
          )}

          {loadingIA && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#d62976" />
              <Text style={styles.loadingText}>Analisando perfil...</Text>
            </View>
          )}

          {!!error && !loadingIA && <Text style={styles.error}>{error}</Text>}

          {result && !loadingIA && !loadingSaved && (
            <>
              <Text style={styles.savedInfo}>Última análise salva localmente</Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={analisarPerfil}
              >
                <Text style={styles.refreshButtonText}>Atualizar análise</Text>
              </TouchableOpacity>

              <View style={styles.scoreCard}>
                <Text style={styles.scoreTitle}>Sua Nota de Engajamento</Text>

                <View style={styles.scoreRing}>
                  <View style={styles.scoreInner}>
                    <Text style={styles.scoreNumber}>{result.score}</Text>
                    <Text style={styles.scoreOutOf}>/ 100</Text>
                  </View>
                </View>

                <Text style={styles.scoreFooter}>
                  {result.score >= 70
                    ? "🔥 Perfil com bom potencial de engajamento"
                    : result.score >= 50
                    ? "📈 Perfil com boa base para crescer"
                    : "⚠️ Perfil com bastante espaço para melhorar"}
                </Text>
              </View>

              <View style={styles.topInfoRow}>
                <View style={styles.smallInfoCard}>
                  <Text style={styles.smallCardTitle}>🧩 Nicho</Text>
                  <ExpandableText
                    text={cleanMarkdown(result.nicho || "Não informado")}
                    maxLength={120}
                  />
                </View>

                <View style={styles.smallInfoCard}>
                  <Text style={styles.smallCardTitle}>✨ Resumo</Text>
                  <ExpandableText
                    text={cleanMarkdown(result.resumo || "Sem resumo")}
                    maxLength={120}
                  />
                </View>
              </View>

              <View style={styles.bioCard}>
                <View style={styles.bioHeader}>
                  <Text style={styles.bioTitle}>✍️ Bio Sugerida</Text>
                  <TouchableOpacity onPress={copiarBio}>
                    <Text style={styles.copyText}>Copiar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.bioInnerBox}>
                  <Text style={styles.bioText}>
                    {cleanMarkdown(result.bioSugerida || "Sem bio sugerida")}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomInfoRow}>
                <View style={styles.listCard}>
                  <Text style={styles.listTitle}>Pontos Fortes</Text>
                  <ExpandableText
                    text={formatText(result.pontosFortes)}
                    maxLength={160}
                  />
                </View>

                <View style={styles.listCard}>
                  <Text style={styles.listTitle}>Pontos Fracos</Text>
                  <ExpandableText
                    text={formatText(result.pontosFracos)}
                    maxLength={160}
                  />
                </View>
              </View>

              {result.metricas && (
                <View style={styles.metricsCard}>
                  <Text style={styles.metricsTitle}>📊 Métricas do Perfil</Text>

                  <Text style={styles.metricItem}>
                    Frequência média de posts:{" "}
                    <Text style={styles.metricValue}>
                      {result.metricas.freqMediaDias ?? 0} dias
                    </Text>
                  </Text>

                  <Text style={styles.metricItem}>
                    Dias desde o último post:{" "}
                    <Text style={styles.metricValue}>
                      {result.metricas.diasDesdeUltimoPost ?? "N/A"}
                    </Text>
                  </Text>

                  <Text style={styles.metricItem}>
                    Média de caracteres por legenda:{" "}
                    <Text style={styles.metricValue}>
                      {result.metricas.mediaCaracteresLegenda ?? 0}
                    </Text>
                  </Text>

                  {result.metricas.tiposDeMidia && (
                    <View style={styles.mediaTypesBox}>
                      <Text style={styles.metricItem}>Tipos de mídia:</Text>
                      {Object.entries(result.metricas.tiposDeMidia).map(
                        ([tipo, quantidade]) => (
                          <Text key={tipo} style={styles.mediaTypeItem}>
                            • {tipo}: {quantidade}
                          </Text>
                        )
                      )}
                    </View>
                  )}
                </View>
              )}

              <LinearGradient
                colors={["#fffdfe", "#da2f71"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.suggestionCard}
              >
                <Text style={styles.suggestionTitle}>🚀 Sugestões de IA</Text>

                <ExpandableText
                  text={formatText(result.sugestoes)}
                  maxLength={180}
                />

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Gerar Plano de Ação</Text>
                </TouchableOpacity>
              </LinearGradient>
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

  headerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },

  safe: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 34,
  },

  analyzeButton: {
    backgroundColor: "#d62976",
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  center: {
    alignItems: "center",
    marginTop: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  error: {
    marginTop: 40,
    textAlign: "center",
    color: "#d62976",
    fontSize: 15,
    fontWeight: "600",
  },

  savedInfo: {
    fontSize: 12,
    color: "#777",
    textAlign: "center",
    marginBottom: 12,
  },

  refreshButton: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  refreshButtonText: {
    color: "#d62976",
    fontSize: 15,
    fontWeight: "800",
  },

  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  scoreTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B6B6B",
    marginBottom: 18,
  },

  scoreRing: {
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 14,
    borderColor: "#E1267D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  scoreInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  scoreNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: "#171717",
  },

  scoreOutOf: {
    fontSize: 18,
    color: "#777",
    marginTop: 2,
  },

  scoreFooter: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
  },

  topInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  smallInfoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    minHeight: 150,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  smallCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#232323",
    marginBottom: 14,
  },

  bioCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  bioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  bioTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1D1D1D",
  },

  copyText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E1267D",
  },

  bioInnerBox: {
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },

  bioText: {
    fontSize: 15,
    lineHeight: 28,
    color: "#3D3D3D",
    fontStyle: "italic",
  },

  bottomInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  listCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    minHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 14,
  },

  metricsCard: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 20,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  metricsTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#232323",
    marginBottom: 14,
  },

  metricItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },

  metricValue: {
    fontWeight: "700",
    color: "#d62976",
  },

  mediaTypesBox: {
    marginTop: 8,
  },

  mediaTypeItem: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
  },

  suggestionCard: {
    marginTop: 22,
    borderRadius: 28,
    padding: 24,
  },

  suggestionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 14,
  },

  actionButton: {
    backgroundColor: "#4F5BD5",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 18,
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});