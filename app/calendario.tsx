import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Calendario() {
  return <HistoryScreen title="Calendário" subtitle="Conteúdos e datas de publicação"><View style={historyStyles.card}><Ionicons name="calendar-outline" size={28} color="#d62976" /><Text style={historyStyles.heading}>Nenhum conteúdo agendado</Text><Text style={historyStyles.body}>Seu calendário editorial aparecerá aqui.</Text></View></HistoryScreen>;
}
