import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function HistoryScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#feda75", "#fa7e1e", "#d62976", "#962fbf", "#4f5bd5"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityLabel="Voltar">
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </View>
  );
}

export const historyStyles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2 },
  heading: { color: "#1E1E1E", fontSize: 17, fontWeight: "800", marginBottom: 8 },
  body: { color: "#666", fontSize: 14, lineHeight: 21 },
  button: { minHeight: 50, backgroundColor: "#d62976", borderRadius: 8, alignItems: "center", justifyContent: "center", flexDirection: "row", marginBottom: 16 },
  buttonText: { color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 8 },
  empty: { textAlign: "center", color: "#777", paddingVertical: 24 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F4F6" },
  header: { minHeight: 94, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center" },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerText: { flex: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#fff", fontSize: 13, marginTop: 4, opacity: 0.94 },
  content: { padding: 20, paddingBottom: 36 },
});
