import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { getGrowth, getSnapshots, type InstagramGrowth, type InstagramSnapshot } from "@/services/instagram-history";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PERIODS = [7, 30, 90] as const;

function FollowerChart({ snapshots }: { snapshots: InstagramSnapshot[] }) {
  const values = snapshots.map((item) => item.followersCount);
  const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(max - min, 1);
  return <View style={styles.chart} accessibilityLabel="Gráfico de evolução de seguidores">{snapshots.map((item) => { const height = 26 + ((item.followersCount - min) / range) * 104; return <View style={styles.barColumn} key={item.id}><Text style={styles.barValue}>{item.followersCount}</Text><View style={[styles.bar, { height }]} /><Text style={styles.barDate}>{new Date(item.capturedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</Text></View>; })}</View>;
}

export default function Crescimento() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [growth, setGrowth] = useState<InstagramGrowth | null>(null);
  const [snapshots, setSnapshots] = useState<InstagramSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const [growthData, historyData] = await Promise.all([getGrowth(days), getSnapshots(days, 90)]); setGrowth(growthData); setSnapshots([...historyData.snapshots].reverse()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar o crescimento."); } finally { setLoading(false); } }, [days]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <HistoryScreen title="Crescimento" subtitle="Evolução do perfil baseada no histórico">
    <View style={styles.periodControl}>{PERIODS.map((period) => <TouchableOpacity key={period} style={[styles.periodButton, days === period && styles.periodActive]} onPress={() => setDays(period)}><Text style={[styles.periodText, days === period && styles.periodTextActive]}>{period} dias</Text></TouchableOpacity>)}</View>
    {loading ? <View style={styles.center}><ActivityIndicator color="#d62976" size="large" /></View> : error ? <View style={historyStyles.card}><Text style={historyStyles.heading}>Não foi possível carregar</Text><Text style={historyStyles.body}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity></View> : !growth?.sufficientData ? <View style={historyStyles.card}><Text style={historyStyles.heading}>Histórico insuficiente</Text><Text style={historyStyles.body}>Ainda não existem dados suficientes. Faça novas coletas para acompanhar o crescimento da conta.</Text></View> : <>
      <View style={styles.currentCard}><Text style={styles.currentLabel}>Seguidores atuais</Text><Text style={styles.currentValue}>{growth.followers?.end ?? 0}</Text><Text style={styles.currentPeriod}>Período de {days} dias</Text></View>
      <View style={styles.summaryGrid}><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Crescimento</Text><Text style={[styles.summaryValue, styles.positive]}>+{growth.followersActivity?.gained ?? 0}</Text></View><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Perda</Text><Text style={[styles.summaryValue, styles.negative]}>-{growth.followersActivity?.lost ?? 0}</Text></View><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Saldo</Text><Text style={styles.summaryValue}>{(growth.followersActivity?.net ?? 0) > 0 ? "+" : ""}{growth.followersActivity?.net ?? 0}</Text></View><View style={styles.summaryItem}><Text style={styles.summaryLabel}>Variação</Text><Text style={styles.summaryValue}>{growth.followers?.percentage === null ? "—" : `${growth.followers?.percentage.toFixed(2)}%`}</Text></View></View>
      <View style={historyStyles.card}><Text style={historyStyles.heading}>Publicações</Text><Text style={historyStyles.body}>De {growth.media?.start ?? 0} para {growth.media?.end ?? 0} · saldo {(growth.media?.absolute ?? 0) > 0 ? "+" : ""}{growth.media?.absolute ?? 0}</Text></View>
      <Text style={styles.sectionTitle}>Evolução de seguidores</Text><View style={historyStyles.card}><FollowerChart snapshots={snapshots} /></View><Text style={styles.sectionTitle}>Coletas do período</Text>{snapshots.map((snapshot) => <View style={styles.snapshotRow} key={snapshot.id}><View><Text style={styles.snapshotDate}>{new Date(snapshot.capturedAt).toLocaleString("pt-BR")}</Text><Text style={historyStyles.body}>{snapshot.mediaCount} publicações</Text></View><Text style={styles.snapshotFollowers}>{snapshot.followersCount}</Text></View>)}
    </>}
  </HistoryScreen>;
}

const styles = StyleSheet.create({
  periodControl: { flexDirection: "row", backgroundColor: "#E9E9ED", borderRadius: 8, padding: 4, marginBottom: 18 }, periodButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 6 }, periodActive: { backgroundColor: "#fff" }, periodText: { color: "#666", fontWeight: "700" }, periodTextActive: { color: "#d62976" }, center: { paddingVertical: 50 }, retry: { color: "#d62976", fontWeight: "800", marginTop: 14 }, currentCard: { backgroundColor: "#d62976", borderRadius: 8, padding: 20, marginBottom: 14 }, currentLabel: { color: "#fff", fontSize: 13 }, currentValue: { color: "#fff", fontSize: 34, fontWeight: "800", marginVertical: 4 }, currentPeriod: { color: "#fff", opacity: 0.9, fontSize: 12 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, summaryItem: { width: "48.5%", minHeight: 92, backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 10 }, summaryLabel: { color: "#666", fontSize: 12 }, summaryValue: { color: "#1E1E1E", fontSize: 22, fontWeight: "800", marginTop: 8 }, positive: { color: "#16834B" }, negative: { color: "#C53535" }, sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E1E1E", marginTop: 6, marginBottom: 12 }, chart: { height: 190, flexDirection: "row", alignItems: "flex-end", gap: 8, overflow: "hidden" }, barColumn: { flex: 1, minWidth: 26, maxWidth: 64, height: 180, alignItems: "center", justifyContent: "flex-end" }, bar: { width: "70%", minWidth: 14, backgroundColor: "#d62976", borderTopLeftRadius: 4, borderTopRightRadius: 4 }, barValue: { color: "#555", fontSize: 10, marginBottom: 4 }, barDate: { color: "#777", fontSize: 9, marginTop: 5 }, snapshotRow: { minHeight: 70, backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, snapshotDate: { color: "#333", fontWeight: "700", marginBottom: 3 }, snapshotFollowers: { color: "#d62976", fontSize: 19, fontWeight: "800" },
});
