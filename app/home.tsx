import { API_URL } from "@/services/api";
import {
  getActiveSessionId,
  removeConnectedAccount,
} from "@/services/session";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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

type InstagramProfile = {
  id: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
};

const USER_STORAGE_KEY = "@user_name";

export default function Home() {
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInstagramConnected, setHasInstagramConnected] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      const [savedName, sessionId] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        getActiveSessionId(),
      ]);

      if (savedName) {
        setUserName(savedName);
      }

      if (!sessionId) {
        setProfile(null);
        setHasInstagramConnected(false);
        return;
      }

      setHasInstagramConnected(true);

      const response = await fetch(
        `${API_URL}/me/instagram/profile?session_id=${encodeURIComponent(
          sessionId
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao buscar perfil");
      }

      setProfile(data);
    } catch (error: any) {
      console.log("Erro ao carregar home:", error);
      setProfile(null);
      setHasInstagramConnected(false);
    } finally {
      setLoading(false);
    }
  }

  function abrirRecursoProtegido(path: string) {
    if (!hasInstagramConnected) {
      Alert.alert(
        "Instagram necessário",
        "Conecte sua conta do Instagram para usar esta função."
      );
      return;
    }

    router.push(path as any);
  }

  async function sair() {
  try {
    const sessionId = await getActiveSessionId();

    if (sessionId) {
      try {
        await fetch(`${API_URL}/auth/app/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (error) {
        console.log("Erro ao avisar logout no backend:", error);
      }

      await removeConnectedAccount(sessionId);
    }

    await AsyncStorage.removeItem(USER_STORAGE_KEY);

    setProfile(null);
    setHasInstagramConnected(false);
    setUserName("");

    router.replace("/");
  } catch (error) {
    console.log("Erro ao sair:", error);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    router.replace("/");
  }
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
              <Text style={styles.welcomeText}>
                Olá{userName ? `, ${userName}` : ""} 👋
              </Text>
              <Text style={styles.headerTitle}>Painel do Instagram</Text>
              <Text style={styles.headerSubtitle}>
                {hasInstagramConnected
                  ? "Dados reais conectados ao seu backend"
                  : "Use o app normalmente e conecte o Instagram quando quiser"}
              </Text>
            </View>

            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>IG</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              {profile?.profile_picture_url ? (
                <Image
                  source={{ uri: profile.profile_picture_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImageFallback}>
                  <Ionicons name="logo-instagram" size={28} color="#d62976" />
                </View>
              )}

              <View style={styles.profileInfo}>
                <Text style={styles.username}>
                  {hasInstagramConnected
                    ? `@${profile?.username || "instagram"}`
                    : "Nenhuma conta conectada"}
                </Text>

                <Text style={styles.profileStatus}>
                  {hasInstagramConnected
                    ? "Conta conectada com sucesso"
                    : "Conecte sua conta para desbloquear recursos automáticos"}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {hasInstagramConnected ? profile?.followers_count ?? 0 : "--"}
                </Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {hasInstagramConnected ? profile?.follows_count ?? 0 : "--"}
                </Text>
                <Text style={styles.statLabel}>Seguindo</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>
                  {hasInstagramConnected ? profile?.media_count ?? 0 : "--"}
                </Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>

            {!hasInstagramConnected && (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => router.push("/contas")}
              >
                <Ionicons name="link-outline" size={18} color="#fff" />
                <Text style={styles.connectButtonText}>Conectar Instagram</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>Ações rápidas</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                !hasInstagramConnected && styles.actionCardDisabled,
              ]}
              onPress={() => abrirRecursoProtegido("/profile")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="person-outline" size={24} color="#d62976" />
              </View>
              <Text style={styles.actionTitle}>Perfil</Text>
              <Text style={styles.actionSubtitle}>
                Veja seus dados e posts reais
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                !hasInstagramConnected && styles.actionCardDisabled,
              ]}
              onPress={() => abrirRecursoProtegido("/analysis")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="analytics-outline" size={24} color="#d62976" />
              </View>
              <Text style={styles.actionTitle}>Análise IA</Text>
              <Text style={styles.actionSubtitle}>
                Gere insights automáticos do perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/contas")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons
                  name="people-circle-outline"
                  size={24}
                  color="#d62976"
                />
              </View>
              <Text style={styles.actionTitle}>Contas</Text>
              <Text style={styles.actionSubtitle}>
                Gerencie contas conectadas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/Sugestao")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="image-outline" size={24} color="#d62976" />
              </View>
              <Text style={styles.actionTitle}>Sugestão</Text>
              <Text style={styles.actionSubtitle}>
                Receba ideias para seus posts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/seguidores")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="people-outline" size={24} color="#d62976" />
              </View>
              <Text style={styles.actionTitle}>Seguidores</Text>
              <Text style={styles.actionSubtitle}>
                Veja listas, comparações e organização do perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                !hasInstagramConnected && styles.actionCardDisabled,
              ]}
              onPress={() => abrirRecursoProtegido("/metricas")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons
                  name="stats-chart-outline"
                  size={24}
                  color="#d62976"
                />
              </View>
              <Text style={styles.actionTitle}>Métricas</Text>
              <Text style={styles.actionSubtitle}>
                Veja score, frequência e desempenho
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/importar-seguidores")}
            >
              <View style={styles.actionIconBox}>
                <Ionicons
                  name="document-attach-outline"
                  size={24}
                  color="#d62976"
                />
              </View>
              <Text style={styles.actionTitle}>Importar</Text>
              <Text style={styles.actionSubtitle}>
                Adicione um arquivo manual de seguidores
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={sair}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sair</Text>
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
    flex: 1,
    marginRight: 12,
  },

  welcomeText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.95,
    marginBottom: 4,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.92,
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
  },

  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPlaceholderText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  container: {
    padding: 20,
    paddingBottom: 36,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 22,
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  profileImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 14,
  },

  profileImageFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  profileInfo: {
    flex: 1,
  },

  username: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 4,
  },

  profileStatus: {
    fontSize: 14,
    color: "#666",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statBox: {
    width: "31.5%",
    backgroundColor: "#F8F8FA",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#d62976",
    marginBottom: 6,
  },

  statLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
  },

  connectButton: {
    marginTop: 18,
    backgroundColor: "#d62976",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  connectButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 14,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  actionCardDisabled: {
    opacity: 0.55,
  },

  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FCE7F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 6,
  },

  actionSubtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },

  logoutButton: {
    marginTop: 10,
    backgroundColor: "#d62976",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 8,
  },
});