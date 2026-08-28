import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "analisador_user_access_token";
let webToken: string | null = null;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export async function getAuthToken(): Promise<string | null> {
  return Platform.OS === "web" ? webToken : SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS === "web") webToken = token;
  else await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (Platform.OS === "web") webToken = null;
  else await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
