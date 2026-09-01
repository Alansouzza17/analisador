import { HistoryScreen, historyStyles } from "@/components/HistoryScreen";
import { createContentPlan, deleteContentPlan, getContentPlans, updateContentPlan, type ContentPlan, type ContentPlanInput, type ContentStatus, type ContentType } from "@/services/content-plans";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const TYPES: ContentType[] = ["post", "reels", "story", "carrossel"];
const STATUSES: ContentStatus[] = ["ideia", "planejado", "publicado", "cancelado"];
const STATUS_LABELS: Record<ContentStatus, string> = { ideia: "Ideia", planejado: "Planejado", publicado: "Publicado", cancelado: "Cancelado" };

function toInputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseInputDate(value: string) {
  if (!value.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim())) throw new Error("Use o formato AAAA-MM-DD HH:mm para a data.");
  const date = new Date(value.trim().replace(" ", "T"));
  if (Number.isNaN(date.getTime())) throw new Error("Informe uma data válida.");
  return date.toISOString();
}

function PlanForm({ item, saving, onClose, onSave }: { item: ContentPlan | null; saving: boolean; onClose: () => void; onSave: (input: ContentPlanInput) => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [contentType, setContentType] = useState<ContentType>(item?.contentType ?? "post");
  const [status, setStatus] = useState<ContentStatus>(item?.status ?? "ideia");
  const [scheduledAt, setScheduledAt] = useState(toInputDate(item?.scheduledAt ?? null));
  const [error, setError] = useState<string | null>(null);

  function submit() {
    try {
      if (!title.trim()) throw new Error("Informe o título do conteúdo.");
      if (title.trim().length > 160) throw new Error("O título deve ter no máximo 160 caracteres.");
      const scheduled = parseInputDate(scheduledAt);
      if (status === "planejado" && !scheduled) throw new Error("Conteúdos planejados precisam de data e hora.");
      setError(null);
      onSave({ title: title.trim(), description: description.trim() || null, contentType, status, scheduledAt: scheduled, publishedAt: status === "publicado" ? item?.publishedAt ?? new Date().toISOString() : null });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Confira os campos informados."); }
  }

  return <KeyboardAvoidingView style={styles.modalScreen} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>{item ? "Editar conteúdo" : "Novo conteúdo"}</Text><TouchableOpacity style={styles.iconButton} onPress={onClose} accessibilityLabel="Fechar"><Ionicons name="close" size={24} color="#333" /></TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled">
    <Text style={styles.label}>Título</Text><TextInput style={styles.input} value={title} onChangeText={setTitle} maxLength={160} placeholder="Nome do conteúdo" />
    <Text style={styles.label}>Descrição ou legenda</Text><TextInput style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription} multiline placeholder="Texto, ideia ou legenda" />
    <Text style={styles.label}>Tipo</Text><View style={styles.choiceWrap}>{TYPES.map((type) => <TouchableOpacity key={type} style={[styles.choice, contentType === type && styles.choiceActive]} onPress={() => setContentType(type)}><Text style={[styles.choiceText, contentType === type && styles.choiceTextActive]}>{type}</Text></TouchableOpacity>)}</View>
    <Text style={styles.label}>Status</Text><View style={styles.choiceWrap}>{STATUSES.map((value) => <TouchableOpacity key={value} style={[styles.choice, status === value && styles.choiceActive]} onPress={() => setStatus(value)}><Text style={[styles.choiceText, status === value && styles.choiceTextActive]}>{STATUS_LABELS[value]}</Text></TouchableOpacity>)}</View>
    <Text style={styles.label}>Data e hora</Text><TextInput style={styles.input} value={scheduledAt} onChangeText={setScheduledAt} placeholder="AAAA-MM-DD HH:mm" autoCapitalize="none" />
    {error && <Text style={styles.formError}>{error}</Text>}
    <TouchableOpacity style={[historyStyles.button, saving && styles.disabled]} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={20} color="#fff" />}<Text style={historyStyles.buttonText}>Salvar</Text></TouchableOpacity>
  </ScrollView></View></KeyboardAvoidingView>;
}

export default function Calendario() {
  const [items, setItems] = useState<ContentPlan[]>([]);
  const [filter, setFilter] = useState<ContentStatus | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPlan | null>(null);

  const load = useCallback(async () => { setLoading(true); setError(null); try { setItems((await getContentPlans(filter === "todos" ? undefined : filter)).items); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar o calendário."); } finally { setLoading(false); } }, [filter]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function save(input: ContentPlanInput) {
    if (saving) return;
    setSaving(true);
    try { if (editing) await updateContentPlan(editing.id, input); else await createContentPlan(input); setFormOpen(false); setEditing(null); await load(); } catch (caught) { Alert.alert("Calendário", caught instanceof Error ? caught.message : "Não foi possível salvar o conteúdo."); } finally { setSaving(false); }
  }

  function confirmDelete(item: ContentPlan) {
    Alert.alert("Excluir conteúdo", `Deseja excluir “${item.title}”?`, [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => void deleteContentPlan(item.id).then(load).catch((caught) => Alert.alert("Calendário", caught instanceof Error ? caught.message : "Não foi possível excluir.")) }]);
  }

  async function changeStatus(item: ContentPlan, status: ContentStatus) {
    try { await updateContentPlan(item.id, { status, publishedAt: status === "publicado" ? new Date().toISOString() : null }); await load(); } catch (caught) { Alert.alert("Calendário", caught instanceof Error ? caught.message : "Não foi possível alterar o status."); }
  }

  const futureItems = items.filter((item) => item.scheduledAt && new Date(item.scheduledAt).getTime() >= Date.now() && !["publicado", "cancelado"].includes(item.status));
  return <HistoryScreen title="Calendário" subtitle="Conteúdos e datas de publicação">
    <TouchableOpacity style={historyStyles.button} onPress={() => { setEditing(null); setFormOpen(true); }}><Ionicons name="add" size={22} color="#fff" /><Text style={historyStyles.buttonText}>Criar conteúdo</Text></TouchableOpacity>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["todos", ...STATUSES] as const).map((value) => <TouchableOpacity key={value} style={[styles.filter, filter === value && styles.filterActive]} onPress={() => setFilter(value)}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === "todos" ? "Todos" : STATUS_LABELS[value]}</Text></TouchableOpacity>)}</ScrollView>
    {loading ? <View style={styles.center}><ActivityIndicator color="#d62976" size="large" /></View> : error ? <View style={historyStyles.card}><Text style={historyStyles.heading}>Não foi possível carregar</Text><Text style={historyStyles.body}>{error}</Text><TouchableOpacity onPress={() => void load()}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity></View> : items.length === 0 ? <View style={historyStyles.card}><Ionicons name="calendar-outline" size={28} color="#d62976" /><Text style={historyStyles.heading}>Nenhum conteúdo encontrado</Text><Text style={historyStyles.body}>Crie um item para começar seu planejamento.</Text></View> : <>
      {filter === "todos" && futureItems.length > 0 && <><Text style={styles.sectionTitle}>Próximos conteúdos</Text>{futureItems.map((item) => <PlanCard key={`future-${item.id}`} item={item} onEdit={() => { setEditing(item); setFormOpen(true); }} onDelete={() => confirmDelete(item)} onStatus={changeStatus} />)}</>}
      <Text style={styles.sectionTitle}>{filter === "todos" ? "Todos os conteúdos" : STATUS_LABELS[filter]}</Text>{items.map((item) => <PlanCard key={item.id} item={item} onEdit={() => { setEditing(item); setFormOpen(true); }} onDelete={() => confirmDelete(item)} onStatus={changeStatus} />)}
    </>}
    <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>{formOpen && <PlanForm item={editing} saving={saving} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={(input) => void save(input)} />}</Modal>
  </HistoryScreen>;
}

function PlanCard({ item, onEdit, onDelete, onStatus }: { item: ContentPlan; onEdit: () => void; onDelete: () => void; onStatus: (item: ContentPlan, status: ContentStatus) => void }) {
  return <View style={historyStyles.card}><View style={styles.cardHeader}><View style={styles.cardTitleWrap}><Text style={historyStyles.heading}>{item.title}</Text><Text style={styles.type}>{item.contentType}</Text></View><View style={styles.actions}><TouchableOpacity style={styles.iconButton} onPress={onEdit} accessibilityLabel="Editar"><Ionicons name="pencil-outline" size={19} color="#555" /></TouchableOpacity><TouchableOpacity style={styles.iconButton} onPress={onDelete} accessibilityLabel="Excluir"><Ionicons name="trash-outline" size={19} color="#C53535" /></TouchableOpacity></View></View>{item.description && <Text style={historyStyles.body}>{item.description}</Text>}<Text style={styles.date}>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("pt-BR") : "Sem data definida"}</Text><View style={styles.statusWrap}>{STATUSES.map((status) => <TouchableOpacity key={status} style={[styles.statusButton, item.status === status && styles.statusActive]} onPress={() => onStatus(item, status)}><Text style={[styles.statusText, item.status === status && styles.statusTextActive]}>{STATUS_LABELS[status]}</Text></TouchableOpacity>)}</View></View>;
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingBottom: 16 }, filter: { minHeight: 40, paddingHorizontal: 15, borderRadius: 8, backgroundColor: "#E9E9ED", alignItems: "center", justifyContent: "center" }, filterActive: { backgroundColor: "#d62976" }, filterText: { color: "#555", fontWeight: "700" }, filterTextActive: { color: "#fff" }, center: { paddingVertical: 44 }, retry: { color: "#d62976", fontWeight: "800", marginTop: 12 }, sectionTitle: { color: "#1E1E1E", fontSize: 18, fontWeight: "800", marginBottom: 12, marginTop: 4 }, cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, cardTitleWrap: { flex: 1, marginRight: 8 }, type: { color: "#962fbf", fontSize: 12, fontWeight: "700", textTransform: "capitalize", marginBottom: 8 }, actions: { flexDirection: "row", gap: 4 }, iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, date: { color: "#555", fontSize: 13, fontWeight: "700", marginTop: 12 }, statusWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }, statusButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 6, backgroundColor: "#F0F0F3", justifyContent: "center" }, statusActive: { backgroundColor: "#FCE7F1" }, statusText: { color: "#666", fontSize: 11, fontWeight: "700" }, statusTextActive: { color: "#d62976" },
  modalScreen: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 18 }, modalCard: { width: "100%", maxWidth: 620, maxHeight: "92%", alignSelf: "center", backgroundColor: "#fff", borderRadius: 8, padding: 20 }, modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, modalTitle: { color: "#1E1E1E", fontSize: 21, fontWeight: "800" }, label: { color: "#333", fontSize: 13, fontWeight: "700", marginBottom: 7, marginTop: 10 }, input: { minHeight: 48, borderWidth: 1, borderColor: "#DEDEE3", borderRadius: 8, paddingHorizontal: 13, color: "#222", backgroundColor: "#FAFAFB" }, textarea: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" }, choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, choice: { minHeight: 39, paddingHorizontal: 12, borderRadius: 7, backgroundColor: "#EFEFF2", justifyContent: "center" }, choiceActive: { backgroundColor: "#d62976" }, choiceText: { color: "#555", fontWeight: "700", textTransform: "capitalize" }, choiceTextActive: { color: "#fff" }, formError: { color: "#B52D2D", marginVertical: 12 }, disabled: { opacity: 0.6 },
});
