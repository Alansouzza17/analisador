import { API_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type UserItem = {
  username: string;
};

type TabType = "followers" | "following";
type FilterType =
  | "todos"
  | "nao_segue"
  | "voce_nao_segue"
  | "deixaram_de_seguir"
  | "novos";

const FOLLOWERS_STORAGE_KEY = "@followers_importados";
const FOLLOWING_STORAGE_KEY = "@following_importados";
const PREVIOUS_FOLLOWERS_STORAGE_KEY = "@followers_importados_anterior";
const LAST_API_FOLLOWERS_COUNT_KEY = "@last_api_followers_count";
const LAST_API_FOLLOWING_COUNT_KEY = "@last_api_following_count";
const FOLLOWERS_COMPARISON_READY_KEY = "@followers_comparison_ready";
const SESSION_STORAGE_KEY = "@instagram_session_id";

export default function SeguidoresScreen() {
  const router = useRouter();
   
  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [previousFollowers, setPreviousFollowers] = useState<UserItem[]>([]);
  const [lastApiFollowers, setLastApiFollowers] = useState<number | null>(null);
  const [lastApiFollowing, setLastApiFollowing] = useState<number | null>(null);
  const [apiReferenceLoaded, setApiReferenceLoaded] = useState(false);
  const [comparisonReady, setComparisonReady] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("followers");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function getSessionId() {
  const sessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  return sessionId;
}
  
 async function carregarDados() {
  try {
    const sessionId = await getSessionId();

    const [
      profileResponse,
      savedFollowers,
      savedFollowing,
      savedPreviousFollowers,
      savedLastFollowers,
      savedLastFollowing,
      savedComparisonReady,
    ] = await Promise.all([
      fetch(
        `${API_URL}/me/instagram/profile?session_id=${sessionId}`
      ),
      AsyncStorage.getItem(FOLLOWERS_STORAGE_KEY),
      AsyncStorage.getItem(FOLLOWING_STORAGE_KEY),
      AsyncStorage.getItem(PREVIOUS_FOLLOWERS_STORAGE_KEY),
      AsyncStorage.getItem(LAST_API_FOLLOWERS_COUNT_KEY),
      AsyncStorage.getItem(LAST_API_FOLLOWING_COUNT_KEY),
      AsyncStorage.getItem(FOLLOWERS_COMPARISON_READY_KEY),
    ]);

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error(profileData?.error || "Erro ao buscar perfil");
    }

    setProfile(profileData);
    setFollowers(savedFollowers ? JSON.parse(savedFollowers) : []);
    setFollowing(savedFollowing ? JSON.parse(savedFollowing) : []);
    setPreviousFollowers(
      savedPreviousFollowers ? JSON.parse(savedPreviousFollowers) : []
    );
    setComparisonReady(savedComparisonReady === "true");

    const parsedLastFollowers = savedLastFollowers
      ? Number(savedLastFollowers)
      : null;

    const parsedLastFollowing = savedLastFollowing
      ? Number(savedLastFollowing)
      : null;

    setLastApiFollowers(parsedLastFollowers);
    setLastApiFollowing(parsedLastFollowing);
    setApiReferenceLoaded(true);

  } catch (error) {
    console.warn("Erro ao carregar tela seguidores:", error);
  } finally {
    setInitialLoading(false);
    setRefreshing(false);
  }
}

  function handleRefresh() {
    setRefreshing(true);
    carregarDados();
  }

  const naoSeguemDeVolta = useMemo(() => {
    const followersSet = new Set(
      followers.map((item) => item.username.toLowerCase())
    );

    return following.filter(
      (item) => !followersSet.has(item.username.toLowerCase())
    );
  }, [followers, following]);

  const seguidoresQueNaoSeguo = useMemo(() => {
    const followingSet = new Set(
      following.map((item) => item.username.toLowerCase())
    );

    return followers.filter(
      (item) => !followingSet.has(item.username.toLowerCase())
    );
  }, [followers, following]);

  const followersChanged = useMemo(() => {
    if (!apiReferenceLoaded || !profile || lastApiFollowers === null) {
      return false;
    }

    return profile.followers_count !== lastApiFollowers;
  }, [apiReferenceLoaded, profile, lastApiFollowers]);

  const followingChanged = useMemo(() => {
    if (!apiReferenceLoaded || !profile || lastApiFollowing === null) {
      return false;
    }

    return profile.follows_count !== lastApiFollowing;
  }, [apiReferenceLoaded, profile, lastApiFollowing]);

  const showUpdateMessage = followersChanged || followingChanged;

  const updateMessage = useMemo(() => {
    const parts: string[] = [];

    if (followersChanged && profile) {
      parts.push(
        `Seguidores: antes ${lastApiFollowers ?? 0}, agora ${profile.followers_count}`
      );
    }

    if (followingChanged && profile) {
      parts.push(
        `Seguindo: antes ${lastApiFollowing ?? 0}, agora ${profile.follows_count}`
      );
    }

    return parts.join("\n");
  }, [
    followersChanged,
    followingChanged,
    profile,
    lastApiFollowers,
    lastApiFollowing,
  ]);

  const canCompareFollowersChange = useMemo(() => {
    if (!comparisonReady) return false;
    if (previousFollowers.length === 0) return false;
    if (followers.length === 0) return false;

    return true;
  }, [comparisonReady, previousFollowers.length, followers.length]);

  const quemDeixouDeSeguir = useMemo(() => {
    if (!canCompareFollowersChange) return [];

    const currentFollowersSet = new Set(
      followers.map((item) => item.username.toLowerCase())
    );

    return previousFollowers.filter(
      (item) => !currentFollowersSet.has(item.username.toLowerCase())
    );
  }, [canCompareFollowersChange, previousFollowers, followers]);

  const novosSeguidores = useMemo(() => {
    if (!canCompareFollowersChange) return [];

    const previousFollowersSet = new Set(
      previousFollowers.map((item) => item.username.toLowerCase())
    );

    return followers.filter(
      (item) => !previousFollowersSet.has(item.username.toLowerCase())
    );
  }, [canCompareFollowersChange, previousFollowers, followers]);

  const currentList = useMemo(() => {
    if (activeFilter === "nao_segue") {
      return naoSeguemDeVolta;
    }

    if (activeFilter === "voce_nao_segue") {
      return seguidoresQueNaoSeguo;
    }

    if (activeFilter === "deixaram_de_seguir") {
      return quemDeixouDeSeguir;
    }

    if (activeFilter === "novos") {
      return novosSeguidores;
    }

    return activeTab === "followers" ? followers : following;
  }, [
    activeFilter,
    activeTab,
    followers,
    following,
    naoSeguemDeVolta,
    seguidoresQueNaoSeguo,
    quemDeixouDeSeguir,
    novosSeguidores,
  ]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList;

    const q = search.toLowerCase().trim();

    return currentList.filter((item) =>
      item.username.toLowerCase().includes(q)
    );
  }, [currentList, search]);

  const renderItem = ({ item }: { item: UserItem }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>@{item.username}</Text>
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
            data={filteredList}
            keyExtractor={(item, index) => `${item.username}-${index}`}
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
                <View style={styles.infoWarning}>
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color="#2563EB"
                  />
                  <Text style={styles.infoWarningText}>
                    A quantidade importada pode ser diferente do Instagram. O
                    arquivo pode conter contas desativadas, removidas,
                    bloqueadas ou indisponíveis no momento.
                  </Text>
                </View>

                {showUpdateMessage && (
                  <View style={styles.updateCard}>
                    <View style={styles.updateHeader}>
                      <Ionicons
                        name="alert-circle"
                        size={18}
                        color="#B45309"
                      />
                      <Text style={styles.updateTitle}>
                        Atualize sua lista
                      </Text>
                    </View>

                    <Text style={styles.updateText}>
                      O número real retornado pela API mudou. Importe uma nova
                      lista para manter a análise correta.
                    </Text>

                    <Text style={styles.updateDetails}>{updateMessage}</Text>

                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() => router.push("/importar-seguidores")}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.updateButtonText}>
                        Atualizar lista
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Seguidores API</Text>
                    <Text style={styles.statValue}>
                      {profile?.followers_count ?? 0}
                    </Text>
                  </View>

                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Seguindo API</Text>
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

                <View style={styles.secondaryStatsRow}>
                  <View style={styles.secondaryCard}>
                    <Text style={styles.secondaryLabel}>
                      Importados seguidores
                    </Text>
                    <Text style={styles.secondaryValue}>{followers.length}</Text>
                  </View>

                  <View style={styles.secondaryCard}>
                    <Text style={styles.secondaryLabel}>
                      Importados seguindo
                    </Text>
                    <Text style={styles.secondaryValue}>{following.length}</Text>
                  </View>
                </View>

                <View style={styles.secondaryStatsRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryCard,
                      activeFilter === "nao_segue" && styles.cardActive,
                    ]}
                    onPress={() => {
                      setActiveFilter("nao_segue");
                      setActiveTab("following");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.secondaryLabel,
                        activeFilter === "nao_segue" && styles.cardActiveLabel,
                      ]}
                    >
                      Não seguem de volta
                    </Text>
                    <Text
                      style={[
                        styles.secondaryValue,
                        activeFilter === "nao_segue" && styles.cardActiveValue,
                      ]}
                    >
                      {naoSeguemDeVolta.length}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryCard,
                      activeFilter === "voce_nao_segue" && styles.cardActive,
                    ]}
                    onPress={() => {
                      setActiveFilter("voce_nao_segue");
                      setActiveTab("followers");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.secondaryLabel,
                        activeFilter === "voce_nao_segue" &&
                          styles.cardActiveLabel,
                      ]}
                    >
                      Você não segue
                    </Text>
                    <Text
                      style={[
                        styles.secondaryValue,
                        activeFilter === "voce_nao_segue" &&
                          styles.cardActiveValue,
                      ]}
                    >
                      {seguidoresQueNaoSeguo.length}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.secondaryStatsRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryCard,
                      activeFilter === "deixaram_de_seguir" &&
                        styles.cardActive,
                    ]}
                    onPress={() => {
                      setActiveFilter("deixaram_de_seguir");
                      setActiveTab("followers");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.secondaryLabel,
                        activeFilter === "deixaram_de_seguir" &&
                          styles.cardActiveLabel,
                      ]}
                    >
                      Deixaram de seguir
                    </Text>
                    <Text
                      style={[
                        styles.secondaryValue,
                        activeFilter === "deixaram_de_seguir" &&
                          styles.cardActiveValue,
                      ]}
                    >
                      {quemDeixouDeSeguir.length}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryCard,
                      activeFilter === "novos" && styles.cardActive,
                    ]}
                    onPress={() => {
                      setActiveFilter("novos");
                      setActiveTab("followers");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.secondaryLabel,
                        activeFilter === "novos" && styles.cardActiveLabel,
                      ]}
                    >
                      Novos seguidores
                    </Text>
                    <Text
                      style={[
                        styles.secondaryValue,
                        activeFilter === "novos" && styles.cardActiveValue,
                      ]}
                    >
                      {novosSeguidores.length}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color="#888" />
                  <TextInput
                    placeholder="Buscar username..."
                    placeholderTextColor="#999"
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>

                {activeFilter !== "todos" && (
                  <TouchableOpacity
                    style={styles.clearFilter}
                    onPress={() => setActiveFilter("todos")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.clearFilterText}>
                      Mostrar lista completa
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.filtersRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeTab === "followers" && styles.filterButtonActive,
                    ]}
                    onPress={() => {
                      setActiveTab("followers");
                      setActiveFilter("todos");
                    }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeTab === "followers" && styles.filterTextActive,
                      ]}
                    >
                      Seguidores
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      activeTab === "following" && styles.filterButtonActive,
                    ]}
                    onPress={() => {
                      setActiveTab("following");
                      setActiveFilter("todos");
                    }}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        activeTab === "following" && styles.filterTextActive,
                      ]}
                    >
                      Seguindo
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.importButton}
                  onPress={() => router.push("/importar-seguidores")}
                >
                  <Text style={styles.importButtonText}>
                    Importar nova lista
                  </Text>
                </TouchableOpacity>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhuma lista encontrada</Text>
                <Text style={styles.emptyText}>
                  Importe um arquivo de seguidores ou seguindo para visualizar
                  aqui.
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
  screen: { flex: 1, backgroundColor: "#F4F4F6" },

  header: { paddingBottom: 22 },

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

  headerIconText: { fontSize: 28 },

  headerAvatar: { width: "100%", height: "100%" },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },

  infoWarning: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  infoWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#1E40AF",
    lineHeight: 18,
    fontWeight: "500",
  },

  updateCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  updateTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "800",
    color: "#9A3412",
  },

  updateText: {
    fontSize: 13,
    color: "#9A3412",
    lineHeight: 19,
  },

  updateDetails: {
    marginTop: 8,
    fontSize: 13,
    color: "#7C2D12",
    fontWeight: "700",
    lineHeight: 19,
  },

  updateButton: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#F59E0B",
  },

  updateButtonText: {
    color: "#B45309",
    fontWeight: "700",
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
    textAlign: "center",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
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

  cardActive: {
    borderWidth: 2,
    borderColor: "#d62976",
    backgroundColor: "#FFF0F7",
  },

  cardActiveLabel: {
    color: "#b81f65",
  },

  cardActiveValue: {
    color: "#b81f65",
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

  clearFilter: {
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d62976",
  },

  clearFilterText: {
    color: "#d62976",
    fontWeight: "700",
    fontSize: 14,
  },

  filtersRow: {
    flexDirection: "row",
    marginBottom: 14,
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

  importButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  importButtonText: {
    color: "#d62976",
    fontSize: 15,
    fontWeight: "800",
  },

  listContent: { paddingBottom: 20 },

  userCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 24,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FCE7F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  userAvatarText: {
    color: "#d62976",
    fontWeight: "800",
    fontSize: 18,
  },

  userInfo: { flex: 1 },

  userName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
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