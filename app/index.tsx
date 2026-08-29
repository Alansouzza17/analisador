import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUser, clearAuthToken, getAuthToken, saveAuthToken } from "../services/auth-session";
import { ApiError, apiRequest } from "../services/http";
import {
  getActiveSessionId,
  saveConnectedAccount,
} from "../services/session";

WebBrowser.maybeCompleteAuthSession();

const USER_STORAGE_KEY = "@user_name";

function getOAuthRedirectUri(nativePath: string): string {
  if (Platform.OS !== "web") return Linking.createURL(nativePath);

  const configuredUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  const candidate = configuredUrl || Linking.createURL("");

  try {
    const url = new URL(candidate);
    const isLocalDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !isLocalDevelopment) throw new Error();
    return url.origin;
  } catch {
    throw new Error("EXPO_PUBLIC_WEB_URL deve ser uma URL HTTPS completa.");
  }
}

type AuthResponse = { user: AuthUser; accessToken: string };
type OAuthCallbackParams = {
  addAccount?: string | string[];
  success?: string | string[];
  session_id?: string | string[];
  user_id?: string | string[];
  username?: string | string[];
  profile_picture_url?: string | string[];
  error?: string | string[];
  provider?: string | string[];
  auth_code?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function Login() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<OAuthCallbackParams>();
  const addAccount = firstParam(searchParams.addAccount);
  const handledCallbackRef = useRef<string | null>(null);

  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

   const verificarLogin = useCallback(async () => {
  try {
    const [savedName, authToken, instagramSessionId] = await Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEY),
      getAuthToken(),
      getActiveSessionId(),
    ]);

    if (savedName && savedName.trim()) {
      setNome(savedName);
    }

    if (addAccount !== "1" && authToken) {
      try {
        const { user } = await apiRequest<{ user: AuthUser }>("/auth/me", { accessToken: authToken });
        await AsyncStorage.setItem(USER_STORAGE_KEY, user.name);
        router.replace("/home");
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await clearAuthToken();
        else throw error;
      }
    }

    if (addAccount !== "1" && instagramSessionId) {
      try {
        await apiRequest("/me/instagram/profile", { sessionId: instagramSessionId });
        router.replace("/home");
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      }
    }
  } catch (error) {
    console.log("Erro ao verificar login:", error);
  } finally {
    setLoading(false);
  }
}, [addAccount, router]);

  const handleOAuthCallback = useCallback(async (params: OAuthCallbackParams) => {
    const success = firstParam(params.success);
    const sessionId = firstParam(params.session_id);
    const userId = firstParam(params.user_id);
    const username = firstParam(params.username);
    const profilePictureUrl = firstParam(params.profile_picture_url);
    const callbackError = firstParam(params.error);
    const provider = firstParam(params.provider);
    const authCode = firstParam(params.auth_code);
    const callbackKey = `${provider || "instagram"}:${authCode || sessionId || callbackError || success || ""}`;

    if (!success || handledCallbackRef.current === callbackKey) return false;
    handledCallbackRef.current = callbackKey;

    try {
      if (provider === "google" && success === "true" && typeof authCode === "string") {
        const exchange = await apiRequest<{ accessToken: string }>("/auth/google/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: authCode }),
        });
        const accessToken = exchange.accessToken;
        await saveAuthToken(accessToken);
        const { user } = await apiRequest<{ user: AuthUser }>("/auth/me", { accessToken });
        await AsyncStorage.setItem(USER_STORAGE_KEY, user.name);
        setSubmitting(false);
        router.replace("/home");
        return true;
      }

      if (success === "true" && typeof sessionId === "string") {
        await apiRequest("/me/instagram/profile", { sessionId });
        const storedName = await AsyncStorage.getItem(USER_STORAGE_KEY);
        const nomeSalvo = storedName?.trim() || "Usuário";

        await AsyncStorage.setItem(USER_STORAGE_KEY, nomeSalvo);
        await saveConnectedAccount({
          id: typeof userId === "string" && userId ? userId : sessionId,
          username:
            typeof username === "string" && username ? username : nomeSalvo,
          sessionId,
          profilePictureUrl:
            typeof profilePictureUrl === "string" && profilePictureUrl
              ? profilePictureUrl
              : undefined,
          connectedAt: Date.now(),
        });

        setSubmitting(false);
        router.replace("/home");
        return true;
      }

      if (success === "false") {
        setSubmitting(false);
        Alert.alert(
          "Erro",
          String(callbackError || "Não foi possível conectar com o Instagram")
        );
        return true;
      }

      setSubmitting(false);
      return true;
    } catch (error) {
      console.log("Erro ao concluir autenticação OAuth:", error);
      setSubmitting(false);
      Alert.alert(
        "Não foi possível concluir o login",
        error instanceof Error ? error.message : "Tente novamente."
      );
      return true;
    }
  }, [router]);

  const handleDeepLink = useCallback(async (url: string) => {
    const parsed = Linking.parse(url);
    return handleOAuthCallback(parsed.queryParams || {});
  }, [handleOAuthCallback]);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleDeepLink(url);
    });

    void (async () => {
      const handledRouterCallback = await handleOAuthCallback(searchParams);
      if (handledRouterCallback) {
        setLoading(false);
        return;
      }

      const initialUrl = await Linking.getInitialURL();
      const handledInitialUrl = initialUrl ? await handleDeepLink(initialUrl) : false;
      if (!handledInitialUrl) await verificarLogin();
    })();

    return () => subscription.remove();
  }, [handleDeepLink, handleOAuthCallback, searchParams, verificarLogin]);

  async function handleEntrar() {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite seu e-mail ou nome de usuário.");
      return;
    }

    if (!senha) {
      Alert.alert("Atenção", "Digite sua senha para continuar.");
      return;
    }

    try {
      setSubmitting(true);
      const data = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nome.trim(), password: senha }),
      });
      await Promise.all([
        saveAuthToken(data.accessToken),
        AsyncStorage.setItem(USER_STORAGE_KEY, data.user.name),
      ]);
      router.replace("/home");
    } catch (error) {
      console.log("Erro ao salvar usuário:", error);
      Alert.alert("Não foi possível entrar", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEntrarGoogle() {
    try {
      setSubmitting(true);
      const googleRedirectUri = getOAuthRedirectUri("google-auth");
      const data = await apiRequest<{ authUrl: string }>(
        `/auth/google/login?redirect_back=${encodeURIComponent(googleRedirectUri)}`
      );
      const result = await WebBrowser.openAuthSessionAsync(data.authUrl, googleRedirectUri);
      if (result.type === "success" && result.url) await handleDeepLink(result.url);
      else setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      Alert.alert("Login com Google", error instanceof Error ? error.message : "Não foi possível entrar com Google.");
    }
  }

  async function handleEntrarInstagram() {
    if (!nome.trim()) {
      Alert.alert("Atenção", "Digite seu nome antes de conectar o Instagram.");
      return;
    }

    try {
      setSubmitting(true);

      const authToken = await getAuthToken();
      const instagramRedirectUri = getOAuthRedirectUri("");

      const data = await apiRequest<{ authUrl: string }>(
        `/auth/app/instagram/login?redirect_back=${encodeURIComponent(instagramRedirectUri)}`,
        { accessToken: authToken }
      );

      if (!data?.authUrl) throw new Error("Falha ao iniciar login com Instagram");

      const result = await WebBrowser.openAuthSessionAsync(
        data.authUrl,
        instagramRedirectUri
      );

      if (result.type === "success" && "url" in result && result.url) {
        await handleDeepLink(result.url);
        return;
      }

      if (result.type === "cancel" || result.type === "dismiss") {
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
    } catch (error: unknown) {
      console.log("Erro ao entrar com Instagram:", error);
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível conectar com o Instagram"
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Carregando...</Text>
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.topArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>✨</Text>
            </View>

            <Text style={styles.appTitle}>Analisador</Text>
            <Text style={styles.appSubtitle}>Entre e veja quem não segue de volta.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.mockProfile}>
  <View style={styles.mockAvatar}>
    <Text style={styles.mockAvatarIcon}>📈</Text>
  </View>

  <View style={styles.mockBadge}>
    <Text style={styles.mockBadgeText}>Análise de seguidores</Text>
  </View>
</View>

<Text style={styles.cardTitle}>Bem-vindo de volta</Text>
<Text style={styles.cardSubtitle}>
  Entre na sua conta para continuar suas análises.
</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>E-mail ou usuário</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#8A8A92" />
                <TextInput
                  value={nome}
                  onChangeText={setNome}
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  textContentType="username"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Senha</Text>
                <TouchableOpacity onPress={() => router.push("/recuperar-senha" as any)}>
                  <Text style={styles.forgotText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#8A8A92" />
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#999"
                  style={styles.input}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  returnKeyType="done"
                  textContentType="password"
                  onSubmitEditing={handleEntrar}
                />
                <TouchableOpacity
                  onPress={() => setMostrarSenha((value) => !value)}
                  accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  hitSlop={10}
                >
                  <Ionicons name={mostrarSenha ? "eye-off-outline" : "eye-outline"} size={21} color="#8A8A92" />
                </TouchableOpacity>
              </View>
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

            <TouchableOpacity style={styles.createAccountRow} onPress={() => router.push("/cadastro" as any)}>
              <Text style={styles.createAccountText}>Não tem uma conta? </Text>
              <Text style={styles.createAccountLink}>Criar conta</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>ou continue com</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleEntrarGoogle}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Continuar com Google"
            >
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                submitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleEntrarInstagram}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>
                Continuar com Instagram
              </Text>
            </TouchableOpacity>

            <View style={styles.footerInfo}>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>IA</Text>
              </View>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>Seguidores</Text>
              </View>
              <View style={styles.footerChip}>
                <Text style={styles.footerChipText}>Insights</Text>
              </View>
            </View>
          </View>
          <Text style={styles.termsText}>
            Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.
          </Text>
          </ScrollView>
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
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
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
    marginBottom: 22,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  logoIcon: {
    fontSize: 31,
  },

  appTitle: {
    fontSize: 28,
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
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },

  mockProfile: {
    alignItems: "center",
    marginBottom: 12,
  },

  mockAvatar: {
  width: 60,
  height: 60,
  borderRadius: 30,
  marginBottom: 8,
  borderWidth: 3,
  borderColor: "#fff",
  backgroundColor: "#FCE7F1",
  alignItems: "center",
  justifyContent: "center",
},
mockAvatarIcon: {
  fontSize: 24,
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
    marginBottom: 18,
  },

  inputWrapper: {
    marginBottom: 14,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  forgotText: {
    color: "#962fbf",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F8",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  input: {
    flex: 1,
    paddingHorizontal: 11,
    paddingVertical: 15,
    fontSize: 15,
    color: "#1E1E1E",
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8EC",
  },

  dividerText: {
    color: "#8A8A92",
    fontSize: 12,
    marginHorizontal: 12,
  },

  googleButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DEDEE3",
    marginBottom: 10,
  },

  googleMark: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "900",
    marginRight: 12,
  },

  googleButtonText: {
    color: "#29292E",
    fontSize: 15,
    fontWeight: "700",
  },

  secondaryButtonText: {
    color: "#1E1E1E",
    fontSize: 16,
    fontWeight: "800",
  },

  footerInfo: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
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

  termsText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 28,
    marginTop: 14,
  },

  createAccountRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 2,
  },

  createAccountText: {
    color: "#6F6F6F",
    fontSize: 13,
  },

  createAccountLink: {
    color: "#962fbf",
    fontSize: 13,
    fontWeight: "800",
  },
});
