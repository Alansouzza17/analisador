import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiRequest } from "../services/http";

export default function RecuperarSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!email.trim()) return Alert.alert("E-mail obrigatório", "Informe seu e-mail.");
    try {
      setLoading(true);
      const data = await apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      Alert.alert("Confira seu e-mail", data.message, [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) { Alert.alert("Não foi possível enviar", error instanceof Error ? error.message : "Tente novamente."); }
    finally { setLoading(false); }
  }
  return <LinearGradient colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]} style={styles.screen}><SafeAreaView style={styles.content}><View style={styles.card}>
    <Text style={styles.title}>Recuperar senha</Text><Text style={styles.subtitle}>Informe seu e-mail para receber as instruções de redefinição.</Text>
    <Text style={styles.label}>E-mail</Text><TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" placeholderTextColor="#999" style={styles.input} onSubmitEditing={submit} />
    <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar instruções</Text>}</TouchableOpacity>
    <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>Voltar para o login</Text></TouchableOpacity>
  </View></SafeAreaView></LinearGradient>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, content: { flex: 1, justifyContent: "center", padding: 20 }, card: { backgroundColor: "#fff", borderRadius: 30, padding: 24 }, title: { fontSize: 26, fontWeight: "800", textAlign: "center", color: "#1E1E1E" }, subtitle: { textAlign: "center", color: "#6F6F6F", lineHeight: 21, marginVertical: 14 }, label: { color: "#333", fontWeight: "700", marginBottom: 8 }, input: { backgroundColor: "#F7F7F8", borderWidth: 1, borderColor: "#ECECEC", borderRadius: 16, padding: 16 }, button: { backgroundColor: "#d62976", minHeight: 54, borderRadius: 20, justifyContent: "center", alignItems: "center", marginTop: 18 }, buttonText: { color: "#fff", fontWeight: "800" }, back: { textAlign: "center", color: "#962fbf", fontWeight: "700", marginTop: 18 } });
