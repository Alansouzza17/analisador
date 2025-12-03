import { StyleSheet, TextInput } from "react-native";

interface Props {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function Input({ placeholder, value, onChangeText }: Props) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="rgba(10, 10, 10, 0.33)"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
