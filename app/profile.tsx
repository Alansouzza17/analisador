import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../services/api";
import { getActiveSessionId } from "../services/session";

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

const SESSION_STORAGE_KEY = "@instagram_session_id";

export default function Profile() {
  const router = useRouter();

  const [profile, setProfile] = useState<InstagramProfile | null>(null);
  const [posts, setPosts] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      setLoading(true);

      const sessionId = await getActiveSessionId();

      if (!sessionId) {
        throw new Error("Nenhuma sessão do Instagram encontrada");
      }

      const [profileResponse, postsResponse] = await Promise.all([
        fetch(
          `${API_URL}/me/instagram/profile?session_id=${encodeURIComponent(sessionId)}`
        ),
        fetch(
          `${API_URL}/me/instagram/media?session_id=${encodeURIComponent(sessionId)}`
        ),
      ]);

      const profileData = await profileResponse.json();
      const postsData = await postsResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData?.error || "Erro ao buscar perfil");
      }

      if (!postsResponse.ok) {
        throw new Error(postsData?.error || "Erro ao buscar posts");
      }

      setProfile(profileData);
      setPosts(Array.isArray(postsData?.data) ? postsData.data : []);
    } catch (error: any) {
      Alert.alert("Erro", error?.message || "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchData}>
            <Text style={styles.refreshText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {profile && (
          <View style={styles.headerCard}>
            <Image
              source={{ uri: profile.profile_picture_url }}
              style={styles.avatar}
            />
            <Text style={styles.username}>@{profile.username}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoNumber}>{profile.followers_count}</Text>
                <Text style={styles.infoLabel}>Seguidores</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoNumber}>{profile.follows_count}</Text>
                <Text style={styles.infoLabel}>Seguindo</Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoNumber}>{profile.media_count}</Text>
                <Text style={styles.infoLabel}>Posts</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Posts</Text>

        {posts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nenhum post encontrado</Text>
            <Text style={styles.emptyText}>
              Quando houver mídia disponível, ela aparecerá aqui.
            </Text>
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <Image source={{ uri: post.media_url }} style={styles.postImage} />
                <Text style={styles.postType}>{post.media_type}</Text>
                <Text style={styles.postDate}>{formatDate(post.timestamp)}</Text>
                <Text numberOfLines={2} style={styles.caption}>
                  {post.caption || "Sem legenda"}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  backText: {
    color: "#fff",
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  refreshText: {
    color: "#fff",
    fontWeight: "bold",
  },
  headerCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 14,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 10,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  infoNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  infoLabel: {
    fontSize: 13,
    color: "#f1f1f1",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  postsGrid: {
    gap: 16,
  },
  postCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 12,
  },
  postImage: {
    width: "100%",
    height: 260,
    borderRadius: 14,
    marginBottom: 10,
  },
  postType: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  postDate: {
    color: "#f3f3f3",
    fontSize: 12,
    marginBottom: 6,
  },
  caption: {
    color: "#fff",
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyText: {
    color: "#f1f1f1",
    fontSize: 14,
    textAlign: "center",
  },
});