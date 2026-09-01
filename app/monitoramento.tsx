import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { captureSnapshot, getSnapshots, type InstagramSnapshot } from "@/services/instagram-history";
import { getActiveConnectedAccount } from "@/services/session";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AUTO_CAPTURE_INTERVAL_MS = 15 * 60 * 1000;

function Delta({ value }: { value: number }) {
  const color = value > 0 ? "#16834B" : value < 0 ? "#C53535" : "#777";
  return <Text style={[styles.delta, { color }]}>{value > 0 ? "+" : ""}{value}</Text>;
}

export default function Monitoramento() {
  const [accountName, setAccountName] = useState("");
  const [snapshots, setSnapshots] = useState<InstagramSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const loadHistory = useCallback(async () => {
    const [account, response] = await Promise.all([getActiveConnectedAccount(), getSnapshots(90, 50)]);
    setAccountName(account?.username ? `@${account.username}` : "Conta ativa");
    setSnapshots(response.snapshots);
    return response.snapshots;
  }, []);

  const collect = useCallback(async (manual: boolean) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setCapturing(true);
    setError(null);
    try {
      const result = await captureSnapshot();
      await loadHistory();
      if (manual) Alert.alert("Monitoramento", result.created ? "Dados atuais registrados com sucesso." : "A conta já possui uma coleta recente.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Não foi possível atualizar os dados da conta.";
      setError(message);
      if (manual) Alert.alert("Não foi possível atualizar", message);
    } finally {
      requestInFlight.current = false;
      setCapturing(false);
    }
  }, [loadHistory]);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await loadHistory();
      const latestTime = history[0] ? new Date(history[0].capturedAt).getTime() : 0;
      if (!latestTime || Date.now() - latestTime >= AUTO_CAPTURE_INTERVAL_MS) await collect(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o monitoramento.");
    } finally {
      setLoading(false);
    }
  }, [collect, loadHistory]);

  useFocusEffect(useCallback(() => { void bootstrap(); }, [bootstrap]));
  const current = snapshots[0];
  const previous = snapshots[1];

  return (
    <HistoryScreen title="Monitoramento" subtitle="Alterações reais da conta ao longo do tempo">
      {loading && snapshots.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color="#d62976" size="large" /><Text style={styles.loadingText}>Carregando dados da conta...</Text></View>
      ) : error && snapshots.length === 0 ? (
        <View style={historyStyles.card}><Text style={historyStyles.heading}>Não foi possível carregar</Text><Text style={historyStyles.body}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={() => void bootstrap()}><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <>
          <View style={historyStyles.card}>
            <View style={styles.accountRow}><Ionicons name="logo-instagram" size={24} color="#d62976" /><View><Text style={styles.accountLabel}>Conta selecionada</Text><Text style={styles.accountName}>{accountName}</Text></View></View>
            <Text style={styles.lastCapture}>{current ? `Última coleta: ${new Date(current.capturedAt).toLocaleString("pt-BR")}` : "Nenhuma coleta realizada"}</Text>
          </View>
          {current ? <><View style={styles.metricsRow}>{[
            ["Seguidores", current.followersCount, previous ? current.followersCount - previous.followersCount : 0],
            ["Seguindo", current.followsCount, previous ? current.followsCount - previous.followsCount : 0],
            ["Publicações", current.mediaCount, previous ? current.mediaCount - previous.mediaCount : 0],
          ].map(([label, value, delta]) => <View style={styles.metric} key={String(label)}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text><Delta value={Number(delta)} /></View>)}</View><Text style={styles.deltaHint}>{previous ? "Diferenças desde a coleta anterior" : "Uma nova coleta permitirá calcular diferenças"}</Text></> : <View style={historyStyles.card}><Text style={historyStyles.heading}>Comece o acompanhamento</Text><Text style={historyStyles.body}>Faça a primeira coleta para registrar os números atuais da conta.</Text></View>}
          <TouchableOpacity style={[historyStyles.button, capturing && styles.disabled]} onPress={() => void collect(true)} disabled={capturing}>{capturing ? <ActivityIndicator color="#fff" /> : <Ionicons name="refresh" size={20} color="#fff" />}<Text style={historyStyles.buttonText}>{capturing ? "Atualizando..." : "Atualizar agora"}</Text></TouchableOpacity>
          {error && <View style={styles.inlineError}><Text style={styles.inlineErrorText}>{error}</Text><TouchableOpacity onPress={() => void collect(false)}><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity></View>}
          <Text style={styles.sectionTitle}>Histórico recente</Text>
          {snapshots.length === 0 ? <Text style={historyStyles.empty}>Nenhuma alteração registrada.</Text> : snapshots.slice(0, 10).map((snapshot, index) => { const older = snapshots[index + 1]; return <View style={historyStyles.card} key={snapshot.id}><Text style={historyStyles.heading}>{new Date(snapshot.capturedAt).toLocaleString("pt-BR")}</Text><View style={styles.historyRow}><Text style={historyStyles.body}>{snapshot.followersCount} seguidores</Text>{older && <Delta value={snapshot.followersCount - older.followersCount} />}</View><Text style={historyStyles.body}>{snapshot.followsCount} seguindo · {snapshot.mediaCount} publicações</Text></View>; })}
        </>
      )}
    </HistoryScreen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", paddingVertical: 48 }, loadingText: { color: "#666", marginTop: 12 }, accountRow: { flexDirection: "row", alignItems: "center", gap: 12 }, accountLabel: { color: "#777", fontSize: 12 }, accountName: { color: "#1E1E1E", fontSize: 19, fontWeight: "800" }, lastCapture: { color: "#666", fontSize: 13, marginTop: 14 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }, metric: { width: "31.5%", minHeight: 112, backgroundColor: "#fff", borderRadius: 8, padding: 12, alignItems: "center", justifyContent: "center" }, metricValue: { color: "#d62976", fontSize: 21, fontWeight: "800" }, metricLabel: { color: "#666", fontSize: 11, marginTop: 5, textAlign: "center" }, delta: { fontSize: 12, fontWeight: "800", marginTop: 5 }, deltaHint: { color: "#777", fontSize: 12, textAlign: "center", marginBottom: 16 }, disabled: { opacity: 0.6 }, inlineError: { backgroundColor: "#FFF0F0", borderRadius: 8, padding: 14, marginBottom: 16 }, inlineErrorText: { color: "#9E2929", marginBottom: 8 }, retryButton: { marginTop: 16, alignSelf: "flex-start" }, retryText: { color: "#d62976", fontWeight: "800" }, sectionTitle: { color: "#1E1E1E", fontSize: 18, fontWeight: "800", marginBottom: 12 }, historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
