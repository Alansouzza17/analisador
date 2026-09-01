import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { getGrowth, type GrowthMetric } from "@/services/instagram-history";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";

function Metric({ label, metric }: { label: string; metric: GrowthMetric }) {
  const sign = metric.absolute > 0 ? "+" : "";
  const percentage = metric.percentage === null ? "Sem base percentual" : `${sign}${metric.percentage.toFixed(2)}%`;
  return (
    <View style={historyStyles.card}>
      <Text style={historyStyles.heading}>{label}</Text>
      <Text style={historyStyles.body}>{metric.start} → {metric.end}</Text>
      <Text style={historyStyles.body}>Variação: {sign}{metric.absolute} ({percentage})</Text>
    </View>
  );
}

export default function Crescimento() {
  const [growth, setGrowth] = useState<Awaited<ReturnType<typeof getGrowth>> | null>(null);
  const [loading, setLoading] = useState(true);
  useFocusEffect(useCallback(() => {
    void getGrowth().then(setGrowth).catch((error) => Alert.alert("Crescimento", error instanceof Error ? error.message : "Não foi possível calcular o crescimento.")).finally(() => setLoading(false));
  }, []));

  return (
    <HistoryScreen title="Crescimento" subtitle="Evolução do perfil baseada no histórico">
      {loading ? <ActivityIndicator color="#d62976" /> : !growth?.sufficientData ? (
        <View style={historyStyles.card}><Text style={historyStyles.heading}>Histórico insuficiente</Text><Text style={historyStyles.body}>{growth?.message}</Text></View>
      ) : (
        <>
          {growth.followers && <Metric label="Seguidores" metric={growth.followers} />}
          {growth.follows && <Metric label="Seguindo" metric={growth.follows} />}
          {growth.media && <Metric label="Publicações" metric={growth.media} />}
        </>
      )}
    </HistoryScreen>
  );
}
