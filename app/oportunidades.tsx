import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { getGrowth } from "@/services/instagram-history";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

export default function Oportunidades() {
  const [growth, setGrowth] = useState<Awaited<ReturnType<typeof getGrowth>> | null>(null);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    void getGrowth()
      .then(setGrowth)
      .catch((error) => Alert.alert("Oportunidades", error instanceof Error ? error.message : "Não foi possível consultar o histórico."))
      .finally(() => setLoading(false));
  }, []));
  const message = growth?.sufficientData
    ? growth.followers && growth.followers.absolute < 0
      ? "A recuperação de seguidores é a prioridade do período atual."
      : "Mantenha a frequência e acompanhe a próxima captura para confirmar a tendência."
    : "Registre pelo menos duas capturas no Monitoramento para revelar oportunidades.";
  return <HistoryScreen title="Oportunidades" subtitle="Ações orientadas pelo histórico da conta">{loading ? <ActivityIndicator color="#d62976" /> : <View style={historyStyles.card}><Text style={historyStyles.heading}>Próxima ação</Text><Text style={historyStyles.body}>{message}</Text></View>}</HistoryScreen>;
}
