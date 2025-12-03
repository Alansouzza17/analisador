import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // animação padrão
        animationDuration: 350,        // velocidade da transição

        // Você pode usar também:
        // "fade"
        // "slide_from_left"
        // "slide_from_bottom"
        // "simple_push"
        // "scale_from_center"
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="analysis" />
    </Stack>
  );
}
