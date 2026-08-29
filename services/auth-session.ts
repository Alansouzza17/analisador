import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_TOKEN_KEY = "analisador_user_access_token";
let webToken: string | null = null;

function getWebStorage(): Storage | null {
  return typeof globalThis.sessionStorage === "undefined" ? null : globalThis.sessionStorage;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export async function getAuthToken(): Promise<string | null> {
  if (Platform.OS !== "web") return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return getWebStorage()?.getItem(AUTH_TOKEN_KEY) ?? webToken;
}

export async function saveAuthToken(token: string): Promise<void> {
  if (Platform.OS !== "web") {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    return;
  }
  webToken = token;
  getWebStorage()?.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  if (Platform.OS !== "web") {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    return;
  }
  webToken = null;
  getWebStorage()?.removeItem(AUTH_TOKEN_KEY);
}
