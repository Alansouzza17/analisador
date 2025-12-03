import TopBar from "@/components/TopBar";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "http://192.168.1.17:3333";

type IAResponse = {
  resumo: string;
  pontosFortes: string;
  pontosFracos: string;
  sugestoes: string;
};

export default function Analysis() {
  const [result, setResult] = useState<IAResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function analisarPerfil() {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/ia/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { username: "meuperfil" },
          posts: []
        })
      });

      const data = await response.json();
      setResult(data);

    } catch (error) {
      console.error(error);
      alert("Erro ao analisar perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={["#FF8A00", "#E91E63", "#673AB7"]} style={{ flex: 1 }}>
      <TopBar title="Análise" />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          <TouchableOpacity style={styles.analyzeBtn} onPress={analisarPerfil}>
            <Text style={styles.analyzeText}>Analisar Perfil</Text>
          </TouchableOpacity>

          {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}

          {result && (
            <>
              <Text style={styles.sectionTitle}>Resumo</Text>
              <Text style={styles.text}>{result.resumo}</Text>

              <Text style={styles.sectionTitle}>Pontos Fortes</Text>
              <Text style={styles.text}>{result.pontosFortes}</Text>

              <Text style={styles.sectionTitle}>Pontos Fracos</Text>
              <Text style={styles.text}>{result.pontosFracos}</Text>

              <Text style={styles.sectionTitle}>Sugestões</Text>
              <Text style={styles.text}>{result.sugestoes}</Text>
            </>
          )}

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  analyzeBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20
  },

  analyzeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333"
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    color: "#fff"
  },

  text: {
    fontSize: 16,
    opacity: 0.9,
    marginVertical: 10,
    color: "#fff"
  }
});
