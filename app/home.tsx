import { API_URL } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";


type PerfilInstagram = {
  username: string;
  media_count: number;
  account_type: string;
  profile_picture_url?: string; // só aparece quando usar Graph API
};

export default function Home() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<PerfilInstagram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    try {
      const res = await fetch(`${API_URL}/instagram/profile`);
      const data = await res.json();
      setPerfil(data);
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
    } finally {
      setLoading(false);
    }
  }

   const [nome, setNome] = useState<string | null>(null);

useEffect(() => {
  (async () => {
    const savedName = await AsyncStorage.getItem("@user_name");
    setNome(savedName);
  })();
}, []);

async function handleLogout() {
  await AsyncStorage.removeItem("@user_name");
  router.replace("/");
}


  return (
    <LinearGradient colors={["#7B1FA2", "#E91E63"]} style={styles.container}>
      <Text style={styles.title}>InstaAnalyser</Text>
      <Text style={styles.subtitle}>Seu assistente de crescimento no Instagram</Text>
      
      {nome && (
    <Text style={{ color: "#fff", fontSize: 18, marginBottom: 8 }}>
    Olá, {nome} 👋
   </Text>
    )}

      {/* CARD DO PERFIL */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 20 }} />
      ) : perfil ? (
        <View style={styles.profileCard}>
          <Image
            source={
              perfil.profile_picture_url
                ? { uri: perfil.profile_picture_url }
                : require("../assets/images/perfil.png")
            }
            style={styles.avatar}
          />

          <View>
            <Text style={styles.username}>@{perfil.username}</Text>
            <Text style={styles.info}>📸 Posts: {perfil.media_count}</Text>
            <Text style={styles.info}>🏷 Tipo: {perfil.account_type}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.error}>Não foi possível carregar o perfil</Text>
      )}

      {/* BOTÕES */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/analysis")}>
          <Text style={styles.btnIcon}>📊</Text>
          <Text style={styles.btnText}>Analisar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={() => router.push("/Sugestao")}>
          <Text style={styles.btnIcon}>📸</Text>
          <Text style={styles.btnText}>Sugestão de Post</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogout} style={{ marginTop: 16 }}>
  <Text style={{ color: "#fff", textAlign: "center", opacity: 0.8 }}>
    Sair
  </Text>
</TouchableOpacity>


      <Text style={styles.footer}>Powered by IA ✨</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },

  subtitle: {
    fontSize: 14,
    opacity: 0.85,
    color: "#fff",
    marginBottom: 14,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 16,
    width: "100%",
    marginBottom: 20,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    backgroundColor: "#ccc",
  },

  username: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  info: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 14,
  },

  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
  },

  btn: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    marginVertical: 8,
  },

  btnIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  footer: {
    marginTop: 25,
    color: "#fff",
    opacity: 0.7,
    fontSize: 12,
  },

  error: {
    color: "#fff",
    marginBottom: 20,
  },
});
