import { API_URL } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PerfilInstagram = {
  username: string;
  media_count: number;
  account_type: string;
  profile_picture_url?: string;
};

export default function Home() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilInstagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState<string | null>(null);

  useEffect(() => {
    carregarPerfil();
  }, []);

  useEffect(() => {
    (async () => {
      const savedName = await AsyncStorage.getItem("@user_name");
      setNome(savedName);
    })();
  }, []);

  async function carregarPerfil() {
    try {
      const res = await fetch(`${API_URL}/instagram/profile`);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(text);
      }

      const data = JSON.parse(text);
      setPerfil(data);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await AsyncStorage.removeItem("@user_name");
    router.replace("/");
  }

  const displayName = nome || "Usuário";
  const username = perfil?.username ? `@${perfil.username}` : "@alex_creator_ia";
  const followers = "12.4K";
  const engagement = "4.8%";
  const postsPerMonth = "24";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.profileRow}>
              <Image
                source={
                  perfil?.profile_picture_url
                    ? { uri: perfil.profile_picture_url }
                    : require("../assets/images/perfil.png")
                }
                style={styles.avatar}
              />

              <View>
                <Text style={styles.greeting}>Olá, {displayName}</Text>
                <Text style={styles.handle}>{username}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={{ marginTop: 30, marginBottom: 30 }}
            />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Seguidores</Text>
                <Text style={styles.statValue}>{followers}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Engajamento</Text>
                <Text style={styles.statValue}>{engagement}</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Posts/Mês</Text>
                <Text style={styles.statValue}>{postsPerMonth}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ferramentas de IA</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        </View>

        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push("/analysis")}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: "#E8F1FB" }]}>
              <Text style={styles.toolIcon}>📊</Text>
            </View>
            <Text style={styles.toolTitle}>Analisar Perfil</Text>
            <Text style={styles.toolSubtitle}>Score de 0–100 e SWOT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push("/Sugestao")}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: "#F3E8FA" }]}>
              <Text style={styles.toolIcon}>✨</Text>
            </View>
            <Text style={styles.toolTitle}>Sugestão Post</Text>
            <Text style={styles.toolSubtitle}>Analise fotos com IA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push("/metricas" as never)}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: "#EAF5EA" }]}>
              <Text style={styles.toolIcon}>📈</Text>
            </View>
            <Text style={styles.toolTitle}>Métricas</Text>
            <Text style={styles.toolSubtitle}>Gráficos e horários</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolCard}
            onPress={() => router.push("/seguidores" as never)}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: "#F8EEDB" }]}>
              <Text style={styles.toolIcon}>👥</Text>
            </View>
            <Text style={styles.toolTitle}>Seguidores</Text>
            <Text style={styles.toolSubtitle}>Quem não te segue?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolCard, styles.singleToolCard]}
            onPress={() => router.push("/configuracoes" as never)}
          >
            <View style={[styles.toolIconWrapper, { backgroundColor: "#F2F2F2" }]}>
              <Text style={styles.toolIcon}>⚙️</Text>
            </View>
            <Text style={styles.toolTitle}>Configurações</Text>
            <Text style={styles.toolSubtitle}>Conta e preferências</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.tipCard}>
          <LinearGradient
            colors={["#d62976", "#962fbf", "#4f5bd5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tipGradient}
          >
            <View style={styles.tipLeft}>
              <View style={styles.tipIconWrapper}>
                <Text style={styles.tipIcon}>💡</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Dica da IA hoje</Text>
                <Text style={styles.tipText}>
                  Seu engajamento sobe 15% quando você posta Reels entre 18h e 20h.
                </Text>
              </View>
            </View>

            <Text style={styles.tipArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 18 }]}>
          Análises Recentes
        </Text>

        <View style={styles.recentList}>
          <TouchableOpacity style={styles.recentItem}>
            <View style={styles.recentIconWrapper}>
              <Text style={styles.recentIcon}>🕘</Text>
            </View>

            <View style={styles.recentTextArea}>
              <Text style={styles.recentTitle}>Análise de @tech_guru</Text>
              <Text style={styles.recentSubtitle}>Score: 78/100 • Ontem</Text>
            </View>

            <Text style={styles.recentArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.recentItem}>
            <View style={styles.recentIconWrapper}>
              <Text style={styles.recentIcon}>🖼️</Text>
            </View>

            <View style={styles.recentTextArea}>
              <Text style={styles.recentTitle}>Sugestão: Foto de Setup</Text>
              <Text style={styles.recentSubtitle}>Legenda gerada • 2 dias atrás</Text>
            </View>

            <Text style={styles.recentArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },

  contentContainer: {
    paddingBottom: 30,
  },

  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    marginRight: 14,
    backgroundColor: "#ddd",
  },

  greeting: {
    fontSize: 21,
    fontWeight: "800",
    color: "#161616",
    marginBottom: 2,
  },

  handle: {
    fontSize: 12,
    color: "#2E2E2E",
    opacity: 0.9,
  },

  notificationButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    fontSize: 24,
    color: "#fff",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
    gap: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#F7F7F8",
    borderRadius: 26,
    paddingVertical: 22,
    paddingHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },

  statValue: {
    fontSize: 20,
    color: "#222",
    fontWeight: "800",
  },

  sectionHeader: {
    marginTop: 28,
    marginHorizontal: 20,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  premiumBadge: {
    backgroundColor: "#F5EBDD",
    borderWidth: 1,
    borderColor: "#DDC8AE",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },

  premiumText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F29A2E",
  },

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  toolCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: 22,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 170,
    justifyContent: "center",
  },

  singleToolCard: {
    width: "48%",
  },

  toolIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  toolIcon: {
    fontSize: 26,
  },

  toolTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 8,
  },

  toolSubtitle: {
    fontSize: 13,
    color: "#707070",
    lineHeight: 18,
  },

  tipCard: {
    marginHorizontal: 20,
    marginTop: 6,
    borderRadius: 28,
    overflow: "hidden",
  },

  tipGradient: {
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tipLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  tipIconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  tipIcon: {
    fontSize: 26,
  },

  tipTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 5,
  },

  tipText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 21,
    opacity: 0.96,
  },

  tipArrow: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "700",
  },

  recentList: {
    paddingHorizontal: 20,
  },

  recentItem: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  recentIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  recentIcon: {
    fontSize: 22,
  },

  recentTextArea: {
    flex: 1,
  },

  recentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },

  recentSubtitle: {
    fontSize: 13,
    color: "#707070",
  },

  recentArrow: {
    fontSize: 28,
    color: "#444",
    marginLeft: 10,
  },

  logoutButton: {
    marginTop: 18,
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
});