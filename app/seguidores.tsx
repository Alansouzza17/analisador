import { API_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type InstagramProfile = {
  id: string;
  username: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
};

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  timestamp: string;
};

type FilterType = "todos" | "com_legenda" | "sem_legenda";

export default function SeguidoresScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [posts, setPosts] = useState<InstagramMedia[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [profileResponse, mediaResponse] = await Promise.all([
        fetch(`${API_URL}/me/instagram/profile`),
        fetch(`${API_URL}/me/instagram/media`),
      ]);

      const profileData = await profileResponse.json();
      const mediaData = await mediaResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData?.error || "Erro ao buscar perfil");
      }

      if (!mediaResponse.ok) {
        throw new Error(mediaData?.error || "Erro ao buscar posts");
      }

      setProfile(profileData);
      setPosts(mediaData?.data || []);
    } catch (error) {
      console.warn("Erro ao carregar dados da tela seguidores:", error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    carregarDados();
  }

  const filteredPosts = useMemo(() => {
    let base = [...posts];

    if (activeFilter === "com_legenda") {
      base = base.filter((item) => !!item.caption?.trim());
    }

    if (activeFilter === "sem_legenda") {
      base = base.filter((item) => !item.caption?.trim());
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      base = base.filter((item) =>
        (item.caption || "").toLowerCase().includes(q)
      );
    }

    return base;
  }, [posts, search, activeFilter]);

  const postsComLegenda = posts.filter((item) => !!item.caption?.trim()).length;
  const postsSemLegenda = posts.filter((item) => !item.caption?.trim()).length;

  function formatarData(dataIso: string) {
    try {
      return new Date(dataIso).toLocaleDateString("pt-BR");
    } catch {
      return dataIso;
    }
  }

  const renderItem = ({ item }: { item: InstagramMedia }) => (
    <View style={styles.postCard}>
      <Image source={{ uri: item.media_url }} style={styles.postImage} />

      <View style={styles.postInfo}>
        <Text style={styles.postType}>{item.media_type}</Text>
        <Text style={styles.postDate}>{formatarData(item.timestamp)}</Text>

        <Text style={styles.caption} numberOfLines={3}>
          {item.caption?.trim() ? item.caption : "Sem legenda"}
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              item.caption?.trim() ? styles.greenBadge : styles.redBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.caption?.trim() ? styles.greenText : styles.redText,
              ]}
            >
              {item.caption?.trim() ? "Com legenda" : "Sem legenda"}
            </Text>
          </View>

          <View style={[styles.statusBadge, styles.newBadge]}>
            <Text style={[styles.statusText, styles.newText]}>
              {item.media_type}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            <View>
              <Text style={styles.headerTitle}>Seguidores</Text>
              <Text style={styles.headerSubtitle}>
                @{profile?.username || "instagram"}
              </Text>
            </View>
          </View>

          <View style={styles.headerIcon}>
            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={styles.headerAvatar}
              />
            ) : (
              <Text style={styles.headerIconText}>👥</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {initialLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#d62976" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#d62976"
              />
            }
            ListHeaderComponent={
              <>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Seguidores</Text>
                    <Text style={styles.statValue}>
                      {profile?.followers_count ?? 0}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Seguindo</Text>
                    <Text style={styles.statValue}>
                      {profile?.follows_count ?? 0}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Posts</Text>
                    <Text style={styles.statValue}>
                      {profile?.media_count ?? 0}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>Observação</Text>
                  <Text style={styles.infoText}>
                    Esta tela mostra métricas reais do perfil e os posts
                    encontrados pela API. A lista completa de seguidores não está
                    disponível no backend atual.
                  </Text>
                </View>

                <View style={styles.secondaryStatsRow}>
                  <View style={styles.secondaryCard}>
                    <Text style={styles.secondaryLabel}>Com legenda</Text>
                    <Text style={styles.secondaryValue}>{postsComLegenda}</Text>
                  </View>

                  <View style={styles.secondaryCard}>
                    <Text style={styles.secondaryLabel}>Sem legenda</Text>
                    <Text style={styles.secondaryValue}>{postsSemLegenda}</Text>
                  </View>
                </View>

                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color="#888" />
                  <TextInput
                    placeholder="Buscar legenda..."
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                <View style={styles.filtersRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeFilter === "todos" && styles.filterButtonActive,
                    ]}
                    onPress={() => setActiveFilter("todos")}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeFilter === "todos" && styles.filterTextActive,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeFilter === "com_legenda" &&
                        styles.filterButtonActive,
                    ]}
                    onPress={() => setActiveFilter("com_legenda")}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeFilter === "com_legenda" &&
                          styles.filterTextActive,
                      ]}
                    >
                      Com legenda
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeFilter === "sem_legenda" &&
                        styles.filterButtonActive,
                    ]}
                    onPress={() => setActiveFilter("sem_legenda")}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeFilter === "sem_legenda" &&
                          styles.filterTextActive,
                      ]}
                    >
                      Sem legenda
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhum post encontrado</Text>
                <Text style={styles.emptyText}>
                  Tente outro filtro ou atualize a lista.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
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

  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  headerIconText: {
    fontSize: 28,
  },

  headerAvatar: {
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
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

  statLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
    marginBottom: 8,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },

  secondaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  secondaryCard: {
    width: "48.5%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  secondaryLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 6,
    fontWeight: "700",
  },

  secondaryValue: {
    fontSize: 20,
    color: "#d62976",
    fontWeight: "800",
  },

  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1E1E1E",
  },

  filtersRow: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-between",
  },

  filterButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  filterButtonActive: {
    backgroundColor: "#E1267D",
    borderColor: "#E1267D",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },

  filterTextActive: {
    color: "#fff",
  },

  listContent: {
    paddingBottom: 20,
  },

  postCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  postImage: {
    width: 82,
    height: 82,
    borderRadius: 18,
    marginRight: 14,
    backgroundColor: "#DDD",
  },

  postInfo: {
    flex: 1,
    justifyContent: "center",
  },

  postType: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  postDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },

  caption: {
    fontSize: 13,
    color: "#444",
    marginBottom: 10,
    lineHeight: 18,
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 6,
  },

  greenBadge: {
    backgroundColor: "#E8F7EC",
  },

  redBadge: {
    backgroundColor: "#FDECEC",
  },

  newBadge: {
    backgroundColor: "#EEF0FF",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  greenText: {
    color: "#1D8F4D",
  },

  redText: {
    color: "#D34B4B",
  },

  newText: {
    color: "#4F5BD5",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },

  loadingText: {
    marginTop: 10,
    color: "#333",
    fontSize: 15,
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
});