import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type PeriodType = "7d" | "30d" | "90d";

export default function Metricas() {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState<PeriodType>("30d");

  const engagementBars = [45, 72, 58, 85, 66, 93, 78];
  const growthBars = [30, 50, 42, 64, 59, 80, 74];

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
                <Text style={styles.headerTitle}>Métricas & Insights</Text>
                <Text style={styles.headerSubtitle}>
                  Entenda seu desempenho no Instagram
                </Text>
              </View>
            </View>

            <View style={styles.headerIcon}>
              <Text style={styles.headerIconText}>📈</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.periodRow}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === "7d" && styles.periodButtonActive,
            ]}
            onPress={() => setActivePeriod("7d")}
          >
            <Text
              style={[
                styles.periodText,
                activePeriod === "7d" && styles.periodTextActive,
              ]}
            >
              7 dias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === "30d" && styles.periodButtonActive,
            ]}
            onPress={() => setActivePeriod("30d")}
          >
            <Text
              style={[
                styles.periodText,
                activePeriod === "30d" && styles.periodTextActive,
              ]}
            >
              30 dias
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              activePeriod === "90d" && styles.periodButtonActive,
            ]}
            onPress={() => setActivePeriod("90d")}
          >
            <Text
              style={[
                styles.periodText,
                activePeriod === "90d" && styles.periodTextActive,
              ]}
            >
              90 dias
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Engajamento</Text>
              <Text style={styles.statValue}>4.8%</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Alcance</Text>
              <Text style={styles.statValue}>12.4K</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Posts</Text>
              <Text style={styles.statValue}>24</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Crescimento</Text>
              <Text style={styles.statValue}>+18%</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Taxa de Engajamento</Text>
            <View style={styles.chartArea}>
              {engagementBars.map((value, index) => (
                <View key={index} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: value * 1.2,
                        backgroundColor: index === 5 ? "#d62976" : "#E5E5EA",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={styles.chartFooter}>
              <Text style={styles.chartInsight}>
                Melhor desempenho na sexta-feira
              </Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Crescimento de Seguidores</Text>
            <View style={styles.chartArea}>
              {growthBars.map((value, index) => (
                <View key={index} style={styles.barColumn}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: value * 1.2,
                        backgroundColor: index === 6 ? "#4f5bd5" : "#E5E5EA",
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={styles.chartFooter}>
              <Text style={styles.chartInsight}>
                Crescimento consistente nas últimas semanas
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🔥 Melhor horário</Text>
              <Text style={styles.infoValue}>18h às 20h</Text>
              <Text style={styles.infoSubtitle}>Maior chance de alcance</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🎯 Melhor formato</Text>
              <Text style={styles.infoValue}>Reels</Text>
              <Text style={styles.infoSubtitle}>Mais engajamento médio</Text>
            </View>
          </View>

          <LinearGradient
            colors={["#d62976", "#962fbf"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiInsightCard}
          >
            <Text style={styles.aiInsightTitle}>💡 Insight da IA</Text>
            <Text style={styles.aiInsightText}>
              Seus Reels publicados à noite geram mais alcance e retenção. Para
              crescer mais rápido, aumente a frequência para 3 publicações por
              semana e mantenha consistência nos horários.
            </Text>
          </LinearGradient>
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

  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  periodButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ECECEC",
  },

  periodButtonActive: {
    backgroundColor: "#E1267D",
    borderColor: "#E1267D",
  },

  periodText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },

  periodTextActive: {
    color: "#fff",
  },

  scrollContent: {
    paddingBottom: 24,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  statLabel: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
    marginBottom: 8,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1E1E1E",
  },

  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 16,
  },

  chartArea: {
    height: 140,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },

  barColumn: {
    width: "12%",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  bar: {
    width: "100%",
    borderRadius: 10,
  },

  chartFooter: {
    marginTop: 16,
  },

  chartInsight: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  infoCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 10,
  },

  infoValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#d62976",
    marginBottom: 8,
  },

  infoSubtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  aiInsightCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 8,
  },

  aiInsightTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },

  aiInsightText: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 24,
  },
});