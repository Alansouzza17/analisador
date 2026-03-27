import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function Configuracoes() {
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  async function handleLogout() {
    try {
      await AsyncStorage.removeItem("@user_name");
      router.replace("/");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível sair da conta");
    }
  }

  function handleFeedback() {
    Alert.alert("Feedback", "Em breve você poderá enviar feedback por aqui.");
  }

  function handleAbout() {
    Alert.alert(
      "Sobre o app",
      "Analisador de Instagram com IA\nVersão 1.0.0"
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <LinearGradient
        colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>

              <View>
                <Text style={styles.headerTitle}>Configurações</Text>
                <Text style={styles.headerSubtitle}>
                  Ajuste sua experiência no app
                </Text>
              </View>
            </View>

            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>⚙️</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>

            <TouchableOpacity style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#EAF5EA" }]}>
                  <Text style={styles.iconEmoji}>👤</Text>
                </View>

                <View>
                  <Text style={styles.settingTitle}>Perfil</Text>
                  <Text style={styles.settingSubtitle}>
                    Edite seus dados e informações
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferências</Text>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#EEF0FF" }]}>
                  <Text style={styles.iconEmoji}>🔔</Text>
                </View>

                <View>
                  <Text style={styles.settingTitle}>Notificações</Text>
                  <Text style={styles.settingSubtitle}>
                    Receba alertas e novidades
                  </Text>
                </View>
              </View>

              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#DADADA", true: "#d62976" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#F2F2F2" }]}>
                  <Text style={styles.iconEmoji}>🌙</Text>
                </View>

                <View>
                  <Text style={styles.settingTitle}>Modo escuro</Text>
                  <Text style={styles.settingSubtitle}>
                    Aparência escura do aplicativo
                  </Text>
                </View>
              </View>

              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: "#DADADA", true: "#4f5bd5" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mais</Text>

            <TouchableOpacity style={styles.settingCard} onPress={handleAbout}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#FCEFD8" }]}>
                  <Text style={styles.iconEmoji}>📄</Text>
                </View>

                <View>
                  <Text style={styles.settingTitle}>Sobre</Text>
                  <Text style={styles.settingSubtitle}>
                    Informações e versão do app
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={handleFeedback}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: "#F3E8FA" }]}>
                  <Text style={styles.iconEmoji}>💬</Text>
                </View>

                <View>
                  <Text style={styles.settingTitle}>Feedback</Text>
                  <Text style={styles.settingSubtitle}>
                    Envie sugestões para melhorar
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F4F6",
  },

  header: {
    paddingBottom: 22,
  },

  headerContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  backButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#151515",
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#1F1F1F",
    opacity: 0.85,
  },

  headerIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerIconText: {
    fontSize: 28,
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  scrollContent: {
    paddingBottom: 28,
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 12,
  },

  settingCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },

  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  iconEmoji: {
    fontSize: 24,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 4,
  },

  settingSubtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  logoutButton: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0D7E2",
  },

  logoutText: {
    color: "#d62976",
    fontSize: 16,
    fontWeight: "800",
  },

  versionText: {
    marginTop: 18,
    textAlign: "center",
    color: "#888",
    fontSize: 13,
  },
});