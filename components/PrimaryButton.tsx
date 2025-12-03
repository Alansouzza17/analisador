import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface Props {
  title: string;
  onPress?: () => void;
}

export default function PrimaryButton({ title, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
