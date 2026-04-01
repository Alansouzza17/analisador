import { API_URL } from "@/services/api";
import { getActiveSessionId } from "@/services/session";
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
const FOLLOWERS_COMPARISON_READY_KEY = "@followers_comparison_ready";
const UPDATE_WARNING_READY_KEY = "@update_warning_ready";

export default function ImportarSeguidores() {
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<
    "followers" | "following" | ""
  >("");

  useEffect(() => {
    carregarUltimaLista();
  }, []);

  async function carregarUltimaLista() {
    try {
      const savedFollowers = await AsyncStorage.getItem(
        FOLLOWERS_STORAGE_KEY
      );

      const savedFollowing = await AsyncStorage.getItem(
        FOLLOWING_STORAGE_KEY
      );

      if (savedFollowing) {
        setUsers(JSON.parse(savedFollowing));
        setImportType("following");
        return;
      }

      if (savedFollowers) {
        setUsers(JSON.parse(savedFollowers));
        setImportType("followers");
      }
    } catch (error) {
      console.log(error);
    }
  }

  function normalizeUsername(value: any) {
    return String(value || "")
      .trim()
      .replace(/^@/, "")
      .toLowerCase();
  }

  function extractUsersFromJson(json: any): UserItem[] {
    let source: any[] = [];

    if (Array.isArray(json)) {
      source = json;
    } else if (Array.isArray(json?.relationships_following)) {
      source = json.relationships_following;
    } else if (Array.isArray(json?.relationships_followers)) {
      source = json.relationships_followers;
    } else if (Array.isArray(json?.followers_1)) {
      source = json.followers_1;
    } else if (Array.isArray(json?.followers)) {
      source = json.followers;
    }

    return source
      .map((item) => {
        const data = item?.string_list_data?.[0];

        return {
          username: normalizeUsername(
            data?.value || item?.username || item?.title
          ),
        };
      })
      .filter((item) => item.username);
  }

  async function selecionarArquivo() {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json"],
      });

      if (result.canceled) return;

      const file = result.assets[0];

      setFileName(file.name);

      const response = await fetch(file.uri);
      const text = await response.text();

      const json = JSON.parse(text);

      let parsedUsers = extractUsersFromJson(json);

      const uniqueUsers = Array.from(
        new Map(
          parsedUsers.map((item) => [
            normalizeUsername(item.username),
            item,
          ])
        ).values()
      );

      setUsers(uniqueUsers);

      if (file.name.toLowerCase().includes("following")) {
        setImportType("following");

        await AsyncStorage.setItem(
          FOLLOWING_STORAGE_KEY,
          JSON.stringify(uniqueUsers)
        );
      } else {
        setImportType("followers");

        const listaAtual = await AsyncStorage.getItem(
          FOLLOWERS_STORAGE_KEY
        );

        if (listaAtual) {
          await AsyncStorage.setItem(
            PREVIOUS_FOLLOWERS_STORAGE_KEY,
            listaAtual
          );

          await AsyncStorage.setItem(
            FOLLOWERS_COMPARISON_READY_KEY,
            "true"
          );
        } else {
          await AsyncStorage.setItem(
            FOLLOWERS_COMPARISON_READY_KEY,
            "false"
          );
        }

        await AsyncStorage.setItem(
          FOLLOWERS_STORAGE_KEY,
          JSON.stringify(uniqueUsers)
        );
      }

      Alert.alert(
        "Importação concluída",
        `${uniqueUsers.length} usuários carregados`
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha ao importar arquivo");
    } finally {
      setLoading(false);
    }
  }

  async function limparDadosImportados() {
    Alert.alert(
      "Limpar dados",
      "Deseja apagar todos os dados importados?",
      [
        { text: "Cancelar" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              FOLLOWERS_STORAGE_KEY,
              FOLLOWING_STORAGE_KEY,
              PREVIOUS_FOLLOWERS_STORAGE_KEY,
              LAST_API_FOLLOWERS_COUNT_KEY,
              LAST_API_FOLLOWING_COUNT_KEY,
              FOLLOWERS_COMPARISON_READY_KEY,
            ]);

            setUsers([]);
            setFileName("");
            setImportType("");
          },
        },
      ]
    );
  }

  async function enviarParaAbaSeguidores() {
    if (users.length === 0) {
      Alert.alert("Importe uma lista primeiro");
      return;
    }

    try {
      const sessionId = await getActiveSessionId();

      const profileFetchUrl = sessionId
        ? `${API_URL}/me/instagram/profile?session_id=${encodeURIComponent(sessionId)}`
        : `${API_URL}/me/instagram/profile`;

      const response = await fetch(profileFetchUrl);

      if (!response.ok) {
        throw new Error("Erro ao buscar perfil após importação");
      }

      const profile = await response.json();

      await AsyncStorage.multiSet([
        [LAST_API_FOLLOWERS_COUNT_KEY, String(profile.followers_count)],
        [LAST_API_FOLLOWING_COUNT_KEY, String(profile.follows_count)],
        [UPDATE_WARNING_READY_KEY, "true"],
      ]);
    } catch (error) {
      console.log(error);
    }

    router.replace("/seguidores");
  }

  return (
    <LinearGradient
      colors={[
        "#feda75",
        "#fa7e1e",
        "#d62976",
        "#962fbf",
        "#4f5bd5",
      ]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Importar lista</Text>

        <TouchableOpacity
  style={styles.helpButton}
  onPress={() => router.push("/como-importar")}
>
  <Text style={styles.helpButtonText}>Ver tutorial com imagens</Text>
</TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={selecionarArquivo}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Importando..."
              : "Selecionar arquivo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reset}
          onPress={limparDadosImportados}
        >
          <Text style={styles.resetText}>
            Limpar dados e recomeçar
          </Text>
        </TouchableOpacity>

        {fileName ? (
          <View style={styles.info}>
            <Text style={styles.infoText}>
              Arquivo: {fileName}
            </Text>

            <Text style={styles.infoText}>
              Tipo: {importType}
            </Text>

            <Text style={styles.infoText}>
              Total: {users.length}
            </Text>
          </View>
        ) : null}

        {users.length > 0 && (
          <TouchableOpacity
            style={styles.send}
            onPress={enviarParaAbaSeguidores}
          >
            <Text style={styles.sendText}>
              Enviar para seguidores
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  buttonText: {
    color: "#d62976",
    fontWeight: "bold",
  },

  reset: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
  },

  resetText: {
    color: "#fff",
    fontWeight: "bold",
  },

  info: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },

  infoText: {
    color: "#fff",
    marginBottom: 6,
  },

  send: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  sendText: {
    color: "#d62976",
    fontWeight: "bold",
  },

  helpButton: {
  backgroundColor: "rgba(255,255,255,0.18)",
  borderRadius: 16,
  paddingVertical: 14,
  alignItems: "center",
  marginBottom: 14,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.28)",
},

helpButtonText: {
  color: "#fff",
  fontSize: 15,
  fontWeight: "800",
},
});