import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUser, saveAuthToken } from "../services/auth-session";
import { apiRequest } from "../services/http";

type AuthResponse = { user: AuthUser; accessToken: string };

export default function Cadastro() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!name.trim() || !email.trim() || !password || !confirmation) return Alert.alert("Campos obrigatórios", "Preencha todos os campos.");
    if (password.length < 8) return Alert.alert("Senha curta", "Use pelo menos 8 caracteres.");
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "A confirmação precisa ser igual à senha.");
    try {
      setLoading(true);
      const data = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      await Promise.all([saveAuthToken(data.accessToken), AsyncStorage.setItem("@user_name", data.user.name)]);
      router.replace("/home");
    } catch (error) {
      Alert.alert("Não foi possível criar a conta", error instanceof Error ? error.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]} style={styles.screen}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
            <View style={styles.card}>
              <Text style={styles.title}>Criar sua conta</Text>
              <Text style={styles.subtitle}>Comece a acompanhar seus insights em poucos passos.</Text>
              <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
              <Field label="Confirmar senha" value={confirmation} onChangeText={setConfirmation} secureTextEntry onSubmitEditing={register} />
              <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={register} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar conta</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()}><Text style={styles.loginLink}>Já tem conta? Entrar</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field(props: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { label, ...inputProps } = props;
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...inputProps} placeholderTextColor="#999" style={styles.input} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, justifyContent: "center", padding: 20 },
  back: { alignSelf: "flex-start", padding: 10, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 30, padding: 24 },
  title: { color: "#1E1E1E", fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { color: "#6F6F6F", textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 22 },
  field: { marginBottom: 14 }, label: { color: "#333", fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: "#F7F7F8", borderColor: "#ECECEC", borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, color: "#1E1E1E" },
  button: { backgroundColor: "#d62976", borderRadius: 20, minHeight: 54, alignItems: "center", justifyContent: "center", marginTop: 4 },
  disabled: { opacity: 0.6 }, buttonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  loginLink: { textAlign: "center", color: "#962fbf", fontWeight: "700", marginTop: 18 },
});
