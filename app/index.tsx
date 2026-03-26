import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 🔵 Facebook Login
import * as AuthSession from "expo-auth-session";

const FB_APP_ID = "1200723172015267";

const discovery = {
  authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
};

export default function Login() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 👇 Criando request para login com Facebook
  const redirectUri = AuthSession.makeRedirectUri({
  scheme: "analisador",
  path: "redirect",
  preferLocalhost: false,
  isTripleSlashed: false,
});


  const [requestFB, responseFB, promptFacebookLogin] =
  AuthSession.useAuthRequest(
    {
      clientId: FB_APP_ID,
      responseType: "code",
      scopes: ["public_profile", "email"],
      redirectUri,
      usePKCE: false
    },
    discovery
  );


  // Se usuário já tem login salvo → pula pro home
  useEffect(() => {
    (async () => {
      const savedName = await AsyncStorage.getItem("@user_name");
      if (savedName) {
        router.replace("/home");
      } else {
        setLoading(false);
      }
    })();
  }, []);

  // 🔵 Se login com Facebook deu certo → salvar nome + ir pro home
  useEffect(() => {
    async function handleFB() {
      if (responseFB?.type === "success") {
        const token = responseFB.params.access_token;

        // Buscar dados do usuário
        const res = await fetch(
          `https://graph.facebook.com/me?access_token=${token}&fields=id,name,picture.type(large)`
        );

        const user = await res.json();

        // Salva o nome localmente
        await AsyncStorage.setItem("@user_name", user.name);

        router.replace("/home");
      }
    }

    handleFB();
  }, [responseFB]);

  async function handleLogin() {
    if (!nome.trim()) return;

    try {
      setSubmitting(true);
      await AsyncStorage.setItem("@user_name", nome.trim());
      router.replace("/home");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={["#7B1FA2", "#E91E63"]} style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#7B1FA2", "#E91E63"]} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.title}>InstaAnalyser</Text>
        <Text style={styles.subtitle}>
          Faça login para analisar seu Instagram com IA
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Como quer ser chamado?</Text>
          <TextInput
            style={styles.input}
            placeholder="Seu nome ou @usuario"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={nome}
            onChangeText={setNome}
          />

          {/* Botão de login manual */}
          <TouchableOpacity
            style={[styles.btn, !nome.trim() && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={!nome.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#333" />
            ) : (
              <Text style={styles.btnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* 🔵 Botão de Login com Facebook */}
          <TouchableOpacity
            style={styles.fbBtn}
            onPress={() => promptFacebookLogin()}
            disabled={!requestFB}
          >
            <Text style={styles.fbBtnText}>Entrar com Facebook</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Dados apenas neste aparelho • Sem senha por enquanto
        </Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.85,
    textAlign: "center",
    marginBottom: 40,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#333",
  },

  // 🔵 Botão Facebook estilizado
  fbBtn: {
    marginTop: 14,
    backgroundColor: "#1877F2",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  fbBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 12,
    color: "#fff",
    opacity: 0.7,
  },
});
