import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Input from "../components/Input";

export default function LoginScreen() {
  const router = useRouter();

  function irParaHome() {
    router.push("/home");
  }

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={styles.gradient}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>

          <Image
            source={require("../assets/images/logo.png")}
            style={styles.avatar}
          />

          <Text style={styles.title}>Bem vindo!</Text>

          <Input placeholder="Usuario" />
          <Input placeholder="Senha" />

          <TouchableOpacity onPress={irParaHome} style={{ marginTop: 10 }}>
            <LinearGradient
              colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Conecte-se</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.links}>
            Lembre de mim          Redefinir senha?
          </Text>

          <Text style={styles.separator}>
            _______________   Ou acessar via   _______________
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.socialBtn}><Text>Google</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}><Text>Facebook</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}><Text>Apple</Text></TouchableOpacity>
          </View>

          <Text style={styles.footer}>É novo por aqui? Crie uma conta.</Text>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20, flex: 1 },
  avatar: { width: 140, height: 140, alignSelf: "center", marginTop: 40 },
  title: {
    fontSize: 26, textAlign: "center", fontWeight: "700",
    color: "#fff", marginVertical: 20,
  },
  links: { color: "#fff", textAlign: "center", marginTop: 15, opacity: 0.8 },
  separator: { marginTop: 20, color: "#fff", opacity: 0.8 },
  footer: { marginTop: 30, textAlign: "center", color: "#fff" },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  socialBtn: {
    width: 95,
    backgroundColor: "white",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  loginButton: {
    paddingVertical: 15,
    borderRadius: 12,
  },
  loginText: {
    fontSize: 16,
    textAlign: "center",
    color: "#fff",
    fontWeight: "700",
  },
});
