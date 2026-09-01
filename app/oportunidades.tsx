import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { getOpportunities, type Opportunity } from "@/services/opportunities";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIORITY_COLORS = { alta: "#C53535", média: "#B26A00", baixa: "#28715A" };

export default function Oportunidades() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems((await getOpportunities()).items); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível gerar as oportunidades."); } finally { setLoading(false); } }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <HistoryScreen title="Oportunidades" subtitle="Regras baseadas no histórico real da conta"><View style={styles.notice}><Ionicons name="analytics-outline" size={21} color="#7C3AED" /><Text style={styles.noticeText}>Estas recomendações são calculadas por regras determinísticas. Relações entre frequência e crescimento indicam correlação, não causalidade.</Text></View>{loading ? <View style={styles.center}><ActivityIndicator color="#d62976" size="large" /></View> : error ? <View style={historyStyles.card}><Text style={historyStyles.heading}>Não foi possível analisar</Text><Text style={historyStyles.body}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity></View> : items.length === 0 ? <View style={historyStyles.card}><Ionicons name="checkmark-circle-outline" size={30} color="#16834B" /><Text style={historyStyles.heading}>Nenhuma ação urgente</Text><Text style={historyStyles.body}>Os dados atuais não acionaram nenhuma das regras disponíveis.</Text></View> : items.map((item) => <View style={historyStyles.card} key={item.id}><View style={styles.cardTop}><Text style={[styles.priority, { color: PRIORITY_COLORS[item.priority] }]}>Prioridade {item.priority}</Text><Text style={styles.date}>{new Date(item.generatedAt).toLocaleString("pt-BR")}</Text></View><Text style={historyStyles.heading}>{item.title}</Text><Text style={historyStyles.body}>{item.explanation}</Text><View style={styles.source}><Text style={styles.sourceLabel}>Dado observado</Text><Text style={styles.sourceText}>{item.source}</Text></View><View style={styles.action}><Ionicons name="arrow-forward-circle-outline" size={20} color="#d62976" /><Text style={styles.actionText}>{item.action}</Text></View></View>)}</HistoryScreen>;
}

const styles = StyleSheet.create({ notice: { backgroundColor: "#F3EDFF", borderRadius: 8, padding: 14, marginBottom: 16, flexDirection: "row", gap: 10 }, noticeText: { color: "#4E3475", flex: 1, fontSize: 13, lineHeight: 19 }, center: { paddingVertical: 44 }, retry: { color: "#d62976", fontWeight: "800", marginTop: 12 }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 10 }, priority: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" }, date: { color: "#888", fontSize: 11 }, source: { backgroundColor: "#F5F5F7", borderRadius: 6, padding: 12, marginTop: 14 }, sourceLabel: { color: "#777", fontSize: 11, fontWeight: "700", marginBottom: 4 }, sourceText: { color: "#333", fontSize: 13, fontWeight: "700" }, action: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14 }, actionText: { color: "#4A4A4A", flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" } });
