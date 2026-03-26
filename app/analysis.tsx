import TopBar from "@/components/TopBar";
import { API_URL } from "@/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


type IAResponse = {
  nicho: string;
  score: number;
  bioSugerida: string;
  resumo: string;
  pontosFortes: string;
  pontosFracos: string;
  sugestoes: string;
};

export default function Analysis() {
  const [result, setResult] = useState<IAResponse | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [error, setError] = useState("");

  async function analisarPerfil() {
    try {
      setLoadingIA(true);
      setError("");
      const response = await fetch(`${API_URL}/ia/analyze`);
      const data = await response.json();
      setResult(data);
    } catch (e) {
      setError("Erro ao analisar perfil");
    } finally {
      setLoadingIA(false);
    }
  }

  return (
    <LinearGradient
      colors={["#7B1FA2", "#E91E63"]}
      style={{ flex: 1 }}
    >
      <TopBar title="Análise do Perfil" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {!result && !loadingIA && (
            <TouchableOpacity style={styles.btn} onPress={analisarPerfil}>
              <Text style={styles.btnText}>Analisar Perfil Agora</Text>
            </TouchableOpacity>
          )}

          {loadingIA && (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
              <Text style={styles.text}>Analisando perfil...</Text>
            </View>
          )}

          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {result && !loadingIA && (
            <>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreText}>{result.score}</Text>
                <Text style={styles.scoreLabel}>SCORE</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>🎯 Nicho</Text>
                <Text style={styles.text}>{result.nicho}</Text>
              </View>

              <View style={styles.bioBox}>
                <Text style={styles.sectionTitle}>📝 Bio Sugerida</Text>
                <Text style={styles.bio}>{result.bioSugerida}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>📊 Resumo</Text>
                <Text style={styles.text}>{result.resumo}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>✅ Pontos Fortes</Text>
                <Text style={styles.text}>{result.pontosFortes}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>⚠️ Pontos Fracos</Text>
                <Text style={styles.text}>{result.pontosFracos}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>🚀 Sugestões</Text>
                <Text style={styles.text}>{result.sugestoes}</Text>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  center: {
    alignItems: "center",
    marginTop: 40,
  },

  btn: {
    marginTop: 80,
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },

  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },

  scoreCard: {
    backgroundColor: "#FFD54F",
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  scoreText: {
    fontSize: 42,
    fontWeight: "800",
    color: "#333",
  },

  scoreLabel: {
    fontWeight: "700",
    color: "#333",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },

  text: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 15,
  },

  bioBox: {
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 14,
    borderRadius: 16,
    marginVertical: 14,
  },

  bio: {
    color: "#FFD54F",
    fontWeight: "600",
    fontSize: 16,
  },

  error: {
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
  },
});
