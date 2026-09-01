import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { captureSnapshot, getSnapshots, type InstagramSnapshot } from "@/services/instagram-history";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";

export default function Monitoramento() {
  const [snapshots, setSnapshots] = useState<InstagramSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setSnapshots((await getSnapshots()).snapshots);
    } catch (error) {
      Alert.alert("Monitoramento", error instanceof Error ? error.message : "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function capture() {
    try {
      setCapturing(true);
      const result = await captureSnapshot();
      await load();
      Alert.alert("Monitoramento", result.created ? "Nova captura registrada." : "Já existe uma captura recente desta conta.");
    } catch (error) {
      Alert.alert("Monitoramento", error instanceof Error ? error.message : "Não foi possível registrar a captura.");
    } finally {
      setCapturing(false);
    }
  }

  return (
    <HistoryScreen title="Monitoramento" subtitle="Alterações reais da conta ao longo do tempo">
      <TouchableOpacity style={historyStyles.button} onPress={capture} disabled={capturing}>
        {capturing ? <ActivityIndicator color="#fff" /> : <Ionicons name="pulse-outline" size={20} color="#fff" />}
        <Text style={historyStyles.buttonText}>{capturing ? "Registrando..." : "Registrar dados atuais"}</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator color="#d62976" /> : snapshots.length === 0 ? (
        <Text style={historyStyles.empty}>Nenhuma captura registrada.</Text>
      ) : snapshots.map((snapshot) => (
        <View style={historyStyles.card} key={snapshot.id}>
          <Text style={historyStyles.heading}>{new Date(snapshot.capturedAt).toLocaleString("pt-BR")}</Text>
          <Text style={historyStyles.body}>Seguidores: {snapshot.followersCount}</Text>
          <Text style={historyStyles.body}>Seguindo: {snapshot.followsCount}</Text>
          <Text style={historyStyles.body}>Publicações: {snapshot.mediaCount}</Text>
        </View>
      ))}
    </HistoryScreen>
  );
}
