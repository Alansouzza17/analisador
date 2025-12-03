import TopBar from "@/components/TopBar";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../components/PrimaryButton";
import ProfileCard from "../components/ProfileCard";
import { Profile } from "../types/profile";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useLocalSearchParams();

   function irParaSugestao() {
    router.push("/Sugestao");
  }

  const mock: Profile = {
    username: String(user),
    avatar: "https://i.pravatar.cc/300",
    followers: "1.234",
    following: "567",
  };

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={{ flex: 1 }}
    >
      <TopBar title="Perfil" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          <ProfileCard profile={mock} />

          <PrimaryButton
            title="Análisar perfil"
            onPress={() => router.push("/analysis")}
          />

          <TouchableOpacity onPress={irParaSugestao} style={styles.btn}>
                       <Text style={styles.text}>Dicas de postagem</Text>
                      </TouchableOpacity>
          <PrimaryButton
         title="Analisar Seguidores"
         onPress={() => router.push("/followers")}
         />


          

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  back: { fontSize: 40, marginBottom: 15, color: "#fff" },
     btn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
