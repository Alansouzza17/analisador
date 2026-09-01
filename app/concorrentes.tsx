import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export default function Concorrentes() {
  return <HistoryScreen title="Concorrentes" subtitle="Perfis de referência para acompanhar"><View style={historyStyles.card}><Ionicons name="trophy-outline" size={28} color="#d62976" /><Text style={historyStyles.heading}>Nenhum perfil cadastrado</Text><Text style={historyStyles.body}>Os perfis de referência serão exibidos nesta área.</Text></View></HistoryScreen>;
}
