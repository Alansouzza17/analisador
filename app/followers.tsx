// app/seguidores.tsx
import PrimaryButton from "@/components/PrimaryButton";
import TopBar from "@/components/TopBar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

type Follower = {
  id: string;
  username: string;
};

export default function FollowersScreen() {
  const router = useRouter();

  // BASE SALVA (exemplo inicial)
  const [savedFollowers, setSavedFollowers] = useState<Follower[]>([
    { id: "1", username: "joao" },
    { id: "2", username: "maria" },
    { id: "3", username: "lucas" },
  ]);

  // NOVA LEITURA (simulação)
  const [currentFollowers, setCurrentFollowers] = useState<Follower[]>([
    { id: "2", username: "maria" },
    { id: "3", username: "lucas" },
    { id: "4", username: "ana" },
  ]);

  const [unfollowers, setUnfollowers] = useState<Follower[]>([]);
  const [newFollowers, setNewFollowers] = useState<Follower[]>([]);

  useEffect(() => {
    compareFollowers();
  }, []);

  const compareFollowers = () => {
    const left = savedFollowers.filter(
      (saved) => !currentFollowers.some((current) => current.id === saved.id)
    );

    const newOnes = currentFollowers.filter(
      (current) => !savedFollowers.some((saved) => saved.id === current.id)
    );

    setUnfollowers(left);
    setNewFollowers(newOnes);
  };

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={styles.container}
    >
      <TopBar title="Seguidores" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Análise de Seguidores</Text>

        {/* DEIXARAM DE SEGUIR */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Deixaram de seguir</Text>
          {unfollowers.length === 0 ? (
            <Text style={styles.empty}>Nenhum 🚀</Text>
          ) : (
            unfollowers.map((user) => (
              <Text key={user.id} style={styles.user}>
                @{user.username}
              </Text>
            ))
          )}
        </View>

        {/* NOVOS SEGUIDORES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Novos seguidores</Text>
          {newFollowers.length === 0 ? (
            <Text style={styles.empty}>Nenhum novo seguidor</Text>
          ) : (
            newFollowers.map((user) => (
              <Text key={user.id} style={styles.user}>
                @{user.username}
              </Text>
            ))
          )}
        </View>

        {/* BOTÃO VER TODOS */}
         <PrimaryButton
                    title="Lista de seguidores"
                    onPress={() => router.push("/seguidores")}
                  />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  user: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  empty: {
    fontSize: 14,
    color: "green",
    fontWeight: "600",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#000000aa",
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
