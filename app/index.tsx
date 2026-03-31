import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../services/api";

WebBrowser.maybeCompleteAuthSession();

const USER_STORAGE_KEY = "@user_name";
const SESSION_STORAGE_KEY = "@instagram_session_id";
const REDIRECT_URI = "analisador://instagram-auth";

export default function Login() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verificarLogin();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  async function verificarLogin() {
    try {
      const [savedName, savedSessionId] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
      ]);

      if (savedName) {
        setNome(savedName);
      }

      if (savedName && savedSessionId) {
        router.replace("/home");
      }
    } catch (error) {
      console.log("Erro ao verificar login:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeepLink(url: string) {
    try {
      const parsed = Linking.parse(url);
      const success = parsed.queryParams?.success;
      const sessionId = parsed.queryParams?.session_id;
      const error = parsed.queryParams?.error;

      if (success === "true" && typeof sessionId === "string") {
        const nomeSalvo = nome.trim() || "Instagram";

        await AsyncStorage.multiSet([
          [USER_STORAGE_KEY, nomeSalvo],
          [SESSION_STORAGE_KEY, sessionId],
        ]);

        setSubmitting(false);
        router.replace("/home");
        return;
      }

      if (success === "false") {
        setSubmitting(false);
        Alert.alert(
          "Erro",
          String(error || "Não foi possível conectar com o Instagram")
        );
      }
    } catch (error) {
      console.log("Erro ao tratar deep link:", error);
      setSubmitting(false);
    }
  }

  async function handleEntrar() {
    if (!nome.trim()) return;

    try {
      setSubmitting(true);
      await AsyncStorage.setItem(USER_STORAGE_KEY, nome.trim());
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      router.replace("/home");
    } catch (error) {
      console.log("Erro ao salvar usuário:", error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEntrarInstagram() {
    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/auth/app/instagram/login`);
      const data = await response.json();

      if (!response.ok || !data?.authUrl) {
        throw new Error(data?.error || "Falha ao iniciar login com Instagram");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.authUrl,
        REDIRECT_URI
      );

      if (result.type === "cancel") {
        setSubmitting(false);
      }
    } catch (error: any) {
      console.log("Erro ao entrar com Instagram:", error);
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível conectar com o Instagram"
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        style={styles.screen}
      >
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}
    >
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.topArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✨</Text>
            </View>

            <Text style={styles.appTitle}>Analisador IA</Text>
            <Text style={styles.appSubtitle}>
              Seu assistente de crescimento no Instagram
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.mockProfile}>
              <Image
                source={require("../assets/images/perfil.png")}
                style={styles.mockAvatar}
              />
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>Instagram Growth</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Bem-vindo de volta</Text>
            <Text style={styles.cardSubtitle}>
              Entre para analisar seu perfil com inteligência artificial
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Seu nome ou @usuário</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                placeholder="Digite seu nome"
                placeholderTextColor="#999"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleEntrar}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleEntrarInstagram}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>Entrar com Instagram</Text>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>IA</Text>
              </View>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>Score</Text>
              </View>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>Insights</Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  flex: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  topArea: {
    alignItems: "center",
    marginTop: 36,
  },

  logoCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  logoIcon: {
    fontSize: 40,
  },

  appTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },

  appSubtitle: {
    fontSize: 15,
    color: "#fff",
    opacity: 0.95,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 34,
    padding: 24,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },

  mockProfile: {
    alignItems: "center",
    marginBottom: 18,
  },

  mockAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },

  mockBadge: {
    backgroundColor: "#F3E8FA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },

  mockBadgeText: {
    color: "#962fbf",
    fontWeight: "700",
    fontSize: 13,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E1E1E",
    textAlign: "center",
    marginBottom: 6,
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#6F6F6F",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
  },

  inputWrapper: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#F7F7F8",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  primaryButton: {
    backgroundColor: "#d62976",
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    backgroundColor: "#F5F5F7",
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  secondaryButtonText: {
    color: "#1E1E1E",
    fontSize: 16,
    fontWeight: "800",
  },

  footerInfo: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  footerChip: {
    backgroundColor: "#F7F7F8",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 6,
  },

  footerChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
});