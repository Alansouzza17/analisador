import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  text: string;
  maxLength?: number;
}

export default function ExpandableText({ text, maxLength = 140 }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const shouldTruncate = text.length > maxLength;

  const displayText =
    !expanded && shouldTruncate
      ? text.substring(0, maxLength) + "..."
      : text;

  return (
    <View>
      <Text style={styles.text}>{displayText}</Text>

      {shouldTruncate && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.more}>
            {expanded ? "Ver menos" : "Ver mais"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },

  more: {
    marginTop: 6,
    color: "#E1267D",
    fontWeight: "600",
  },
});