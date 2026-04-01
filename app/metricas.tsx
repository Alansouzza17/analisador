import { API_URL } from "@/services/api";
import { getActiveSessionId } from "@/services/session";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type InstagramProfile = {
  id: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
};

type IAResponse = {
  nicho?: string;
  score: number;
  bioSugerida: string;
  resumo: string;
  pontosFortes: string[] | string;
  pontosFracos: string[] | string;
  sugestoes: string[] | string;
  metricas?: {
    freqMediaDias?: number;
    diasDesdeUltimoPost?: number | null;
    mediaCaracteresLegenda?: number;
    tiposDeMidia?: Record<string, number>;
  };
};

export default function Metricas() {
  const router = useRouter();

  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [analysis, setAnalysis] = useState<IAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const SESSION_STORAGE_KEY = "@instagram_session_id";

  async function getSessionId() {
    return await getActiveSessionId();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const sessionId = await getSessionId();

      if (!sessionId) {
        throw new Error("Sessão não encontrada");
      }

      const [profileResponse, analysisResponse] = await Promise.all([
        fetch(
          `${API_URL}/me/instagram/profile?session_id=${encodeURIComponent(
            sessionId
          )}`
        ),
        fetch(
          `${API_URL}/ia/analyze?session_id=${encodeURIComponent(sessionId)}`
        ),
      ]);

      const profileData = await profileResponse.json();
      const analysisData = await analysisResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData?.error || "Erro ao buscar perfil");
      }

      if (!analysisResponse.ok) {
        throw new Error(analysisData?.error || "Erro ao buscar análise");
      }

      setProfile(profileData);
      setAnalysis(analysisData);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar as métricas"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregarDados();
  }

  function getScoreLabel(score: number) {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    if (score >= 40) return "Regular";
    return "Baixo";
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Carregando métricas...</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

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
                <Text style={styles.headerTitle}>Métricas</Text>
                <Text style={styles.headerSubtitle}>
                  @{profile?.username || "instagram"}
                </Text>
              </View>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons name="stats-chart" size={30} color="#fff" />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d62976"
            />
          }
        >
          <View style={styles.scoreCard}>
            <Text style={styles.scoreTitle}>Score do Perfil</Text>

            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{analysis?.score ?? 0}</Text>
              <Text style={styles.scoreTotal}>/100</Text>
            </View>

            <Text style={styles.scoreLabel}>
              {getScoreLabel(analysis?.score ?? 0)}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.followers_count ?? 0}</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.follows_count ?? 0}</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.media_count ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>Desempenho</Text>

            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Frequência média de posts</Text>
              <Text style={styles.metricValue}>
                {analysis?.metricas?.freqMediaDias ?? 0} dias
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Dias desde o último post</Text>
              <Text style={styles.metricValue}>
                {analysis?.metricas?.diasDesdeUltimoPost ?? "N/A"}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricName}>Média de caracteres por legenda</Text>
              <Text style={styles.metricValue}>
                {analysis?.metricas?.mediaCaracteresLegenda ?? 0}
              </Text>
            </View>
          </View>

          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>Tipos de mídia</Text>

            {analysis?.metricas?.tiposDeMidia &&
            Object.keys(analysis.metricas.tiposDeMidia).length > 0 ? (
              Object.entries(analysis.metricas.tiposDeMidia).map(
                ([tipo, quantidade]) => (
                  <View key={tipo} style={styles.metricRow}>
                    <Text style={styles.metricName}>{tipo}</Text>
                    <Text style={styles.metricValue}>{quantidade}</Text>
                  </View>
                )
              )
            ) : (
              <Text style={styles.emptyText}>Nenhum dado de mídia disponível</Text>
            )}
          </View>

          <View style={styles.metricsCard}>
            <Text style={styles.sectionTitle}>Resumo estratégico</Text>
            <Text style={styles.summaryText}>
              {analysis?.resumo || "Resumo não disponível"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/analysis")}
          >
            <Text style={styles.actionButtonText}>Ver análise completa</Text>
          </TouchableOpacity>
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

  safe: {
    flex: 1,
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
    color: "#fff",
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
  },

  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    padding: 20,
    paddingBottom: 36,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  scoreCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },

  scoreTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    marginBottom: 18,
  },

  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 12,
    borderColor: "#d62976",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  scoreNumber: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  scoreTotal: {
    fontSize: 16,
    color: "#666",
  },

  scoreLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d62976",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    width: "31.5%",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#d62976",
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },

  metricsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 14,
  },

  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  metricName: {
    flex: 1,
    fontSize: 14,
    color: "#444",
    marginRight: 12,
  },

  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#d62976",
  },

  summaryText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },

  emptyText: {
    fontSize: 14,
    color: "#777",
  },

  actionButton: {
    backgroundColor: "#d62976",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});