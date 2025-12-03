import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { Profile } from "../types/profile";

interface Props {
  profile: Profile;
}

export default function ProfileCard({ profile }: Props) {
  return (
    <LinearGradient
      colors={["#F58529", "#DD2A7B", "#8134AF", "#515BD4"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Image source={{ uri: profile.avatar }} style={styles.avatar} />

      <Text style={styles.name}>@{profile.username}</Text>

      <View style={styles.row}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Seguidores</Text>
          <Text style={styles.metricValue}>{profile.followers}</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Seguindo</Text>
          <Text style={styles.metricValue}>{profile.following}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 100,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 15,
    borderRadius: 12,
    width: 130,
  },
  metricLabel: {
    color: "#fff",
    opacity: 0.8,
  },
  metricValue: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
    marginTop: 5,
  },
});
