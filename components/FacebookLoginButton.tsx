import * as AuthSession from "expo-auth-session";
import React, { useEffect } from "react";
import { Alert, Button, View } from "react-native";

const FB_APP_ID = " 1200723172015267"; // coloque seu App ID do Facebook aqui

const discovery = {
  authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
};

export default function FacebookLoginButton() {
  // 👉 redirectUri simples, SEM opções
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FB_APP_ID,
      responseType: AuthSession.ResponseType.Token,
      scopes: ["public_profile", "email"],
      redirectUri,
    },
    discovery
  );

  useEffect(() => {
    const handleAuth = async () => {
      if (response?.type === "success" && response.params.access_token) {
        const accessToken = response.params.access_token as string;

        try {
          const res = await fetch(
            `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`
          );

          const user = await res.json();

          console.log("Usuário Facebook:", user);
          Alert.alert("Login com Facebook", `Olá, ${user.name}! 👋`);

          // aqui você integra com seu fluxo (salvar usuário, navegar, etc.)
        } catch (err) {
          console.error(err);
          Alert.alert("Erro", "Não foi possível pegar os dados do usuário.");
        }
      } else if (response?.type === "error") {
        Alert.alert("Erro", "Falha no login com Facebook.");
      }
    };

    handleAuth();
  }, [response]);

  return (
    <View>
      <Button
        title="Entrar com Facebook"
        onPress={() => {
          // 👇 chamada simples, sem useProxy aqui também
          promptAsync();
        }}
        disabled={!request}
      />
    </View>
  );
}
