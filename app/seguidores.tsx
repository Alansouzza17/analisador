// app/seguidores-lista.tsx
import TopBar from "@/components/TopBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Follower = {
  id: string;
  username: string;
  avatarUrl: string;
};

const API_URL = "http://192.168.1.7:3333";

const PAGE_SIZE = 15;
const STORAGE_KEY = "@followers_all";

/**
 * Simulação de uma API real com paginação
 * (poderia ser um fetch para seu backend no futuro)
 */
async function getFollowersApi(page: number, pageSize: number) {
  const response = await fetch(
    `${API_URL}/followers?page=${page}&limit=${pageSize}`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar seguidores");
  }

  return response.json();
}


export default function FollowersListScreen() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Carrega do armazenamento local + puxa primeira página da "API"
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
    // Evita chamadas duplicadas
    if (loadingMore || refreshing) return;
    if (!hasMore && !replace) return;

    if (requestedPage === 1 && !replace) {
      // nada
    }

    replace ? setRefreshing(true) : setLoadingMore(true);

    try {
      const result = await getFollowersApi(requestedPage, PAGE_SIZE);
const data: Follower[] = result.data;

setHasMore(result.hasMore);


      // Se voltar menos que o tamanho da página, acabou a paginação
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
          // evita duplicados
          const ids = new Set(prev.map((f) => f.id));
          const filtered = data.filter((f) => !ids.has(f.id));
          newList = [...prev, ...filtered];
        }

        // SALVAMENTO LOCAL
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
    loadPage(1, true); // replace = true → recarrega tudo
  };

  const renderItem = ({ item }: { item: Follower }) => (
    <View style={styles.row}>
      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />

      <View style={{ flex: 1 }}>
        <Text style={styles.username}>@{item.username}</Text>
        <Text style={styles.subtitle}>Seguidor ativo (simulação)</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={styles.container}
    >
      <TopBar title="Todos os seguidores" />

      <View style={styles.content}>
        <Text style={styles.title}>Lista completa</Text>

        {initialLoading && followers.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Carregando seguidores...</Text>
          </View>
        ) : (
          <FlatList
            data={followers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={{ marginVertical: 16 }} />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#fff"
              />
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  subtitle: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#000",
  },
});
