import { API_URL } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type Follower = {
  id: string;
  username: string;
  avatarUrl: string;
  followsYouBack?: boolean;
  isNew?: boolean;
};

const PAGE_SIZE = 15;
const STORAGE_KEY = "@followers_all";

async function getFollowersApi(page: number, pageSize: number) {
  const response = await fetch(
    `${API_URL}/followers?page=${page}&limit=${pageSize}`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar seguidores");
  }

  return response.json();
}

type FilterType = "todos" | "nao_segue" | "novos";

export default function FollowersListScreen() {
  const router = useRouter();

  const [followers, setFollowers] = useState<Follower[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("todos");

  useEffect(() => {
    const initialize = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFollowers(JSON.parse(stored));
        }

        await loadPage(1, true);
      } catch (e) {
        console.warn("Erro ao carregar seguidores:", e);
      } finally {
        setInitialLoading(false);
      }
    };

    initialize();
  }, []);

  const loadPage = async (requestedPage: number, replace = false) => {
    if (loadingMore || refreshing) return;
    if (!hasMore && !replace) return;

    replace ? setRefreshing(true) : setLoadingMore(true);

    try {
      const result = await getFollowersApi(requestedPage, PAGE_SIZE);
      const data: Follower[] = (result.data || []).map((item: Follower, index: number) => ({
        ...item,
        followsYouBack:
          typeof item.followsYouBack === "boolean"
            ? item.followsYouBack
            : (requestedPage + index) % 3 !== 0,
        isNew:
          typeof item.isNew === "boolean"
            ? item.isNew
            : (requestedPage + index) % 5 === 0,
      }));

      setHasMore(!!result.hasMore);

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setPage(requestedPage);

      setFollowers((prev) => {
        let newList: Follower[];

        if (replace) {
          newList = data;
        } else {
          const ids = new Set(prev.map((f) => f.id));
          const filtered = data.filter((f) => !ids.has(f.id));
          newList = [...prev, ...filtered];
        }

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        return newList;
      });
    } catch (e) {
      console.warn("Erro ao buscar página:", e);
    } finally {
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadPage(page + 1);
    }
  };

  const handleRefresh = () => {
    setHasMore(true);
    loadPage(1, true);
  };

  const filteredFollowers = useMemo(() => {
    let base = [...followers];

    if (activeFilter === "nao_segue") {
      base = base.filter((item) => item.followsYouBack === false);
    }

    if (activeFilter === "novos") {
      base = base.filter((item) => item.isNew === true);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      base = base.filter((item) => item.username.toLowerCase().includes(q));
    }

    return base;
  }, [followers, search, activeFilter]);

  const totalFollowers = followers.length;
  const notFollowingBack = followers.filter((f) => f.followsYouBack === false).length;
  const newFollowers = followers.filter((f) => f.isNew === true).length;

  const renderItem = ({ item }: { item: Follower }) => (
    <View style={styles.followerCard}>
      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />

      <View style={styles.followerInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.name}>Instagram follower</Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              item.followsYouBack ? styles.greenBadge : styles.redBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.followsYouBack ? styles.greenText : styles.redText,
              ]}
            >
              {item.followsYouBack ? "Segue de volta" : "Não segue de volta"}
            </Text>
          </View>

          {item.isNew ? (
            <View style={[styles.statusBadge, styles.newBadge]}>
              <Text style={[styles.statusText, styles.newText]}>Novo</Text>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="chevron-forward" size={20} color="#777" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
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
                <Text style={styles.headerSubtitle}>Análise dos seus seguidores</Text>
              </View>
            </View>

            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>👥</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{totalFollowers}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Não segue</Text>
            <Text style={styles.statValue}>{notFollowingBack}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Novos</Text>
            <Text style={styles.statValue}>{newFollowers}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#8A8A8A" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar seguidores"
            placeholderTextColor="#8A8A8A"
            style={styles.searchInput}
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
              activeFilter === "nao_segue" && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter("nao_segue")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "nao_segue" && styles.filterTextActive,
              ]}
            >
              Não segue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === "novos" && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter("novos")}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === "novos" && styles.filterTextActive,
              ]}
            >
              Novos
            </Text>
          </TouchableOpacity>
        </View>

        {initialLoading && followers.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#d62976" />
            <Text style={styles.loadingText}>Carregando seguidores...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredFollowers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ marginVertical: 16 }} color="#d62976" />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#d62976"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhum seguidor encontrado</Text>
                <Text style={styles.emptyText}>
                  Tente outro filtro ou atualize a lista.
                </Text>
              </View>
            }
          />
        )}
      </View>
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

  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    fontSize: 28,
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

  followerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
    backgroundColor: "#DDD",
  },

  followerInfo: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  name: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
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

  moreButton: {
    marginLeft: 10,
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