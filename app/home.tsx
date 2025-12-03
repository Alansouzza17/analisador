import TopBar from "@/components/TopBar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, ScrollView, StyleSheet, Text } from "react-native";
import Input from "../components/Input";
import PrimaryButton from "../components/PrimaryButton";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");


  return (
    <ImageBackground
      source={require("../assets/images/bg-home.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0.6)"]}
        style={styles.gradient}
      >
        <TopBar title="Perfil" />
        
        <ScrollView contentContainerStyle={styles.container}>
         

          <Text style={{ color: "#fff" }}>Digite seu nome de usuário:</Text>

          <Input
            placeholder="@"
            value={username}
            onChangeText={setUsername}
          />


          <PrimaryButton
            title="Buscar"
            onPress={() => router.push(`/profile?user=${username}`)}
          />

        </ScrollView>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#fff",
    marginBottom: 20,
  },
  centerArrow: {
    textAlign: "center",
    fontSize: 40,
    marginTop: 20,
    color: "#fff",
  },
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
