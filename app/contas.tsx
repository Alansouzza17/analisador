import {
  ConnectedAccount,
  getActiveSessionId,
  getConnectedAccounts,
  removeConnectedAccount,
  setActiveSessionId,
} from "@/services/session";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContasScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [activeSessionId, setActiveSession] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  async function loadAccounts() {
    const [savedAccounts, active] = await Promise.all([
      getConnectedAccounts(),
      getActiveSessionId(),
    ]);

    setAccounts(savedAccounts);
    setActiveSession(active);
  }

  async function handleSelect(sessionId: string) {
    await setActiveSessionId(sessionId);
    setActiveSession(sessionId);
    Alert.alert("Pronto", "Conta ativa alterada com sucesso.");
    router.back();
  }

  async function handleRemove(sessionId: string) {
  const isActive = sessionId === activeSessionId;

  await removeConnectedAccount(sessionId);

  if (isActive) {
    const updatedAccounts = await getConnectedAccounts();

    if (updatedAccounts.length > 0) {
      await setActiveSessionId(updatedAccounts[0].sessionId);
    } else {
      // Nenhuma conta conectada — continua no app normalmente
      setActiveSession(null);
    }
  }

  await loadAccounts();
}

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contas conectadas</Text>
            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {accounts.length === 0 && (
  <View style={styles.emptyBox}>
    <Text style={styles.emptyTitle}>
      Nenhuma conta conectada
    </Text>

    <Text style={styles.emptyText}>
      Você pode usar o app normalmente e conectar uma conta depois.
    </Text>
  </View>
)}

      <FlatList
        contentContainerStyle={styles.list}
        data={accounts}
        keyExtractor={(item) => item.sessionId}
        renderItem={({ item }) => {
          const isActive = item.sessionId === activeSessionId;

          return (
            <View style={styles.card}>
              <View style={styles.left}>
                {item.profilePictureUrl ? (
                  <Image source={{ uri: item.profilePictureUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {item.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={styles.username}>@{item.username}</Text>
                  <Text style={styles.status}>
                    {isActive ? "Conta ativa" : "Conta conectada"}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                {!isActive && (
                  <TouchableOpacity
                    style={styles.useButton}
                    onPress={() => handleSelect(item.sessionId)}
                  >
                    <Text style={styles.useButtonText}>Usar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => handleRemove(item.sessionId)}>
                  <Ionicons name="trash-outline" size={22} color="#d62976" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.addButtonText}>Conectar nova conta</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F4F6" },
  header: { paddingBottom: 22 },
  headerContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FCE7F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarFallbackText: {
    color: "#d62976",
    fontWeight: "800",
    fontSize: 20,
  },
  username: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E1E1E",
  },
  status: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  useButton: {
    backgroundColor: "#d62976",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  useButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  addButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  addButtonText: {
    color: "#d62976",
    fontSize: 16,
    fontWeight: "800",
  },
  emptyBox: {
  backgroundColor: "#fff",
  borderRadius: 20,
  padding: 20,
  margin: 20,
},

emptyTitle: {
  fontSize: 16,
  fontWeight: "800",
  color: "#1E1E1E",
  marginBottom: 6,
},

emptyText: {
  fontSize: 14,
  color: "#666",
  lineHeight: 20,
},
});