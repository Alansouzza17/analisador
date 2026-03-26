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
  backgroundColor: "#fff",
  paddingVertical: 16,
  borderRadius: 50,
  alignItems: "center",
  marginTop: 30,
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 6,
  elevation: 6,
},

  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
