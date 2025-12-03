import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TopBar({ title }: { title: string }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={{ width: 30 }} /> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  back: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
  },

  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
});
