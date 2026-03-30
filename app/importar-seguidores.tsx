import { API_URL } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type UserItem = {
  username: string;
};

const FOLLOWERS_STORAGE_KEY = "@followers_importados";
const FOLLOWING_STORAGE_KEY = "@following_importados";
const PREVIOUS_FOLLOWERS_STORAGE_KEY = "@followers_importados_anterior";
const LAST_API_FOLLOWERS_COUNT_KEY = "@last_api_followers_count";
const LAST_API_FOLLOWING_COUNT_KEY = "@last_api_following_count";

export default function ImportarSeguidores() {
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<"followers" | "following" | "">(
    ""
  );

  useEffect(() => {
    carregarUltimaLista();
  }, []);

  async function carregarUltimaLista() {
    try {
      const savedFollowers = await AsyncStorage.getItem(FOLLOWERS_STORAGE_KEY);
      const savedFollowing = await AsyncStorage.getItem(FOLLOWING_STORAGE_KEY);

      if (savedFollowing) {
        const parsed = JSON.parse(savedFollowing);
        setUsers(parsed);
        setImportType("following");
        return;
      }

      if (savedFollowers) {
        const parsed = JSON.parse(savedFollowers);
        setUsers(parsed);
        setImportType("followers");
      }
    } catch (error) {
      console.log("Erro ao carregar última lista:", error);
    }
  }

  function normalizeUsername(value: unknown) {
    return String(value || "").trim().replace(/^@/, "");
  }

  function detectarTipoArquivo(name: string): "followers" | "following" | "" {
    const lower = name.toLowerCase();

    if (lower.includes("followers")) return "followers";

    if (
      lower.includes("following") ||
      lower.includes("relationships_following")
    ) {
      return "following";
    }

    return "";
  }

  function extractUsersFromJson(json: any): UserItem[] {
    let source: any[] = [];

    if (Array.isArray(json)) {
      source = json;
    } else if (Array.isArray(json?.relationships_following)) {
      source = json.relationships_following;
    } else if (Array.isArray(json?.relationships_followers)) {
      source = json.relationships_followers;
    } else if (Array.isArray(json?.followers)) {
      source = json.followers;
    } else if (Array.isArray(json?.following)) {
      source = json.following;
    } else if (Array.isArray(json?.followers_1)) {
      source = json.followers_1;
    } else if (Array.isArray(json?.followers_2)) {
      source = json.followers_2;
    } else if (Array.isArray(json?.connections?.followers)) {
      source = json.connections.followers;
    }

    return source
      .map((item: any) => {
        const data = item?.string_list_data?.[0];

        const username = normalizeUsername(
          item?.title || data?.value || item?.username || item?.value || ""
        );

        return { username };
      })
      .filter((item: UserItem) => item.username);
  }

  function extractUsersFromText(text: string): UserItem[] {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("username") ||
      firstLine.includes("usuario") ||
      firstLine.includes("usuário");

    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines
      .map((line) => {
        const firstColumn = line.split(",")[0]?.trim();
        return { username: normalizeUsername(firstColumn) };
      })
      .filter((item) => item.username);
  }

  async function selecionarArquivo() {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/csv", "text/plain"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);

      let tipo = detectarTipoArquivo(file.name);

      const response = await fetch(file.uri);
      const text = await response.text();

      let parsedUsers: UserItem[] = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        parsedUsers = extractUsersFromJson(json);

        if (!tipo) {
          if (
            Array.isArray(json?.relationships_following) ||
            Array.isArray(json?.following)
          ) {
            tipo = "following";
          } else if (
            Array.isArray(json?.relationships_followers) ||
            Array.isArray(json?.followers) ||
            Array.isArray(json?.followers_1) ||
            Array.isArray(json?.followers_2)
          ) {
            tipo = "followers";
          }
        }
      } else {
        parsedUsers = extractUsersFromText(text);
      }

      setImportType(tipo);

      const totalOriginal = parsedUsers.length;

      const uniqueUsers = Array.from(
        new Map(
          parsedUsers
            .map((item) => ({
              username: normalizeUsername(item.username).toLowerCase(),
            }))
            .filter((item) => item.username.length > 0)
            .filter((item) => /^[a-z0-9._]+$/.test(item.username))
            .filter(
              (item) =>
                !item.username.startsWith("__deleted__") &&
                !item.username.includes("desativ") &&
                !item.username.includes("deleted")
            )
            .map((item) => [item.username, item])
        ).values()
      );

      const totalFinal = uniqueUsers.length;
      const removidos = totalOriginal - totalFinal;

      setUsers(uniqueUsers);

      if (tipo === "followers") {
        const listaAtual = await AsyncStorage.getItem(FOLLOWERS_STORAGE_KEY);

        if (listaAtual) {
          await AsyncStorage.setItem(
            PREVIOUS_FOLLOWERS_STORAGE_KEY,
            listaAtual
          );
        }

        await AsyncStorage.setItem(
          FOLLOWERS_STORAGE_KEY,
          JSON.stringify(uniqueUsers)
        );
      }

      if (tipo === "following") {
        await AsyncStorage.setItem(
          FOLLOWING_STORAGE_KEY,
          JSON.stringify(uniqueUsers)
        );
      }

      if (uniqueUsers.length === 0) {
        Alert.alert(
          "Arquivo lido",
          "Não encontrei usernames válidos nesse arquivo."
        );
      } else {
        Alert.alert(
          "Importação concluída",
          `${totalFinal} usernames carregados.\n${removidos} usuários inválidos ou duplicados removidos.`
        );
      }
    } catch (error) {
      console.log("Erro ao importar arquivo:", error);
      Alert.alert("Erro", "Não foi possível importar o arquivo.");
    } finally {
      setLoading(false);
    }
  }

  function getImportTypeLabel() {
    if (importType === "followers") return "Seguidores";
    if (importType === "following") return "Seguindo";
    return "Tipo não identificado";
  }

  async function enviarParaAbaSeguidores() {
    if (users.length === 0) {
      Alert.alert("Atenção", "Importe uma lista antes de continuar.");
      return;
    }

    try {
      const profileResponse = await fetch(`${API_URL}/me/instagram/profile`);
      const profileData = await profileResponse.json();

      if (profileResponse.ok) {
        await AsyncStorage.setItem(
          LAST_API_FOLLOWERS_COUNT_KEY,
          String(profileData.followers_count)
        );

        await AsyncStorage.setItem(
          LAST_API_FOLLOWING_COUNT_KEY,
          String(profileData.follows_count)
        );
      }
    } catch (error) {
      console.log("Erro ao salvar referência da API:", error);
    }

    router.push("/seguidores");
  }

  return (
    <LinearGradient
      colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Importar seguidores</Text>
        <Text style={styles.subtitle}>
          Importe arquivos do Instagram para preencher a aba de seguidores e
          seguindo.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Como gerar a lista de forma simples</Text>

          <Text style={styles.step}>1. Abra o Instagram no celular.</Text>
          <Text style={styles.step}>2. Vá em Perfil.</Text>
          <Text style={styles.step}>3. Abra o menu no canto superior.</Text>
          <Text style={styles.step}>4. Entre na Central de Contas.</Text>
          <Text style={styles.step}>
            5. Vá em “Suas informações e permissões”.
          </Text>
          <Text style={styles.step}>6. Toque em “Baixar suas informações”.</Text>
          <Text style={styles.step}>7. Escolha o formato JSON.</Text>
          <Text style={styles.step}>
            8. Importe primeiro o arquivo de seguidores e depois o de seguindo.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Formatos aceitos</Text>
          <Text style={styles.infoText}>• JSON exportado do Instagram</Text>
          <Text style={styles.infoText}>• CSV com coluna username</Text>
          <Text style={styles.infoText}>• TXT com um username por linha</Text>
        </View>

        <TouchableOpacity
          style={[styles.importButton, loading && styles.importButtonDisabled]}
          onPress={selecionarArquivo}
          disabled={loading}
        >
          <Text style={styles.importButtonText}>
            {loading ? "Importando..." : "Selecionar arquivo"}
          </Text>
        </TouchableOpacity>

        {fileName ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Arquivo selecionado</Text>
            <Text style={styles.infoValue}>{fileName}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Tipo detectado</Text>
          <Text style={styles.infoValue}>{getImportTypeLabel()}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Total importado</Text>
          <Text style={styles.infoValue}>{users.length}</Text>
        </View>

        {users.length > 0 && (
          <>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Prévia dos usernames</Text>

              {users.slice(0, 20).map((item, index) => (
                <Text key={`${item.username}-${index}`} style={styles.previewItem}>
                  @{item.username}
                </Text>
              ))}

              {users.length > 20 && (
                <Text style={styles.moreText}>
                  ...e mais {users.length - 20} usernames
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={enviarParaAbaSeguidores}
            >
              <Text style={styles.sendButtonText}>Enviar para aba Seguidores</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  backText: {
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  step: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  importButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  importButtonDisabled: {
    opacity: 0.7,
  },
  importButtonText: {
    color: "#d62976",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    color: "#fff",
    fontSize: 13,
    marginBottom: 6,
  },
  infoValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  previewCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  previewItem: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  moreText: {
    color: "#fff",
    fontSize: 13,
    marginTop: 10,
    fontStyle: "italic",
  },
  sendButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  sendButtonText: {
    color: "#d62976",
    fontSize: 16,
    fontWeight: "bold",
  },
});