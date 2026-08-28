import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../services/http";

export default function RedefinirSenha() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!token) return Alert.alert("Link inválido", "Solicite uma nova recuperação de senha.");
    if (password.length < 8) return Alert.alert("Senha curta", "Use pelo menos 8 caracteres.");
    if (password !== confirmation) return Alert.alert("Senhas diferentes", "Digite a mesma senha nos dois campos.");
    try {
      setLoading(true);
      await apiRequest("/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      Alert.alert("Senha atualizada", "Agora você já pode entrar com a nova senha.", [{ text: "Entrar", onPress: () => router.replace("/") }]);
    } catch (error) { Alert.alert("Não foi possível redefinir", error instanceof Error ? error.message : "Tente novamente."); }
    finally { setLoading(false); }
  }
  return <LinearGradient colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]} style={styles.screen}><SafeAreaView style={styles.content}><View style={styles.card}>
    <Text style={styles.title}>Nova senha</Text><Text style={styles.subtitle}>Crie uma senha segura com pelo menos 8 caracteres.</Text>
    <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Nova senha" placeholderTextColor="#999" style={styles.input} />
    <TextInput value={confirmation} onChangeText={setConfirmation} secureTextEntry placeholder="Confirmar nova senha" placeholderTextColor="#999" style={styles.input} onSubmitEditing={submit} />
    <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar nova senha</Text>}</TouchableOpacity>
  </View></SafeAreaView></LinearGradient>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, content: { flex: 1, justifyContent: "center", padding: 20 }, card: { backgroundColor: "#fff", borderRadius: 30, padding: 24 }, title: { fontSize: 26, fontWeight: "800", textAlign: "center", color: "#1E1E1E" }, subtitle: { textAlign: "center", color: "#6F6F6F", marginVertical: 14 }, input: { backgroundColor: "#F7F7F8", borderWidth: 1, borderColor: "#ECECEC", borderRadius: 16, padding: 16, marginBottom: 14 }, button: { backgroundColor: "#d62976", minHeight: 54, borderRadius: 20, justifyContent: "center", alignItems: "center" }, buttonText: { color: "#fff", fontWeight: "800" } });
