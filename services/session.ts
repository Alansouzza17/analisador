import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type ConnectedAccount = {
  id: string;
  username: string;
  sessionId: string;
  profilePictureUrl?: string;
  connectedAt: number;
};

type StoredAccount = Omit<ConnectedAccount, "sessionId"> & { sessionId?: string };

export const ACCOUNTS_STORAGE_KEY = "@instagram_accounts";
const ACTIVE_ACCOUNT_STORAGE_KEY = "@instagram_active_account_id";
const LEGACY_ACTIVE_SESSION_STORAGE_KEY = "@instagram_active_account";
const ACTIVE_SESSION_SECURE_KEY = "instagram_active_session";
const ACCOUNT_SESSION_PREFIX = "instagram_account_session_";

const webSessionStore = new Map<string, string>();

async function getSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") return webSessionStore.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    webSessionStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteSecureValue(key: string): Promise<void> {
  if (Platform.OS === "web") {
    webSessionStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

function accountSessionKey(accountId: string): string {
  return `${ACCOUNT_SESSION_PREFIX}${accountId}`;
}

async function readStoredAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    return [];
  }
}

async function persistAccountMetadata(accounts: StoredAccount[]): Promise<void> {
  const sanitized = accounts.map(({ sessionId: _sessionId, ...account }) => account);
  await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(sanitized));
}

export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const storedAccounts = await readStoredAccounts();
  let migratedLegacySession = false;

  const accounts = await Promise.all(
    storedAccounts.map(async (account) => {
      let sessionId = await getSecureValue(accountSessionKey(account.id));

      if (!sessionId && account.sessionId) {
        sessionId = account.sessionId;
        await setSecureValue(accountSessionKey(account.id), sessionId);
        migratedLegacySession = true;
      }

      return sessionId ? { ...account, sessionId } : null;
    })
  );

  if (migratedLegacySession) await persistAccountMetadata(storedAccounts);
  return accounts.filter((account): account is ConnectedAccount => account !== null);
}

export async function saveConnectedAccount(account: ConnectedAccount): Promise<void> {
  const storedAccounts = await readStoredAccounts();
  const metadata: StoredAccount = {
    id: account.id,
    username: account.username,
    profilePictureUrl: account.profilePictureUrl,
    connectedAt: account.connectedAt,
  };
  const updated = [metadata, ...storedAccounts.filter((item) => item.id !== account.id)];

  await Promise.all([
    persistAccountMetadata(updated),
    setSecureValue(accountSessionKey(account.id), account.sessionId),
    setSecureValue(ACTIVE_SESSION_SECURE_KEY, account.sessionId),
    AsyncStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, account.id),
  ]);
}

export async function getActiveSessionId(): Promise<string | null> {
  const secureSession = await getSecureValue(ACTIVE_SESSION_SECURE_KEY);
  if (secureSession) return secureSession;

  const legacySession = await AsyncStorage.getItem(LEGACY_ACTIVE_SESSION_STORAGE_KEY);
  if (!legacySession) return null;

  await setSecureValue(ACTIVE_SESSION_SECURE_KEY, legacySession);
  await AsyncStorage.removeItem(LEGACY_ACTIVE_SESSION_STORAGE_KEY);
  return legacySession;
}

export async function setActiveSessionId(sessionId: string): Promise<void> {
  const accounts = await getConnectedAccounts();
  const account = accounts.find((item) => item.sessionId === sessionId);

  await setSecureValue(ACTIVE_SESSION_SECURE_KEY, sessionId);
  if (account) await AsyncStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, account.id);
  await AsyncStorage.removeItem(LEGACY_ACTIVE_SESSION_STORAGE_KEY);
}

export async function clearActiveSessionId(): Promise<void> {
  await Promise.all([
    deleteSecureValue(ACTIVE_SESSION_SECURE_KEY),
    AsyncStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY),
    AsyncStorage.removeItem(LEGACY_ACTIVE_SESSION_STORAGE_KEY),
  ]);
}

export async function getActiveConnectedAccount(): Promise<ConnectedAccount | null> {
  const [accounts, activeAccountId, activeSessionId] = await Promise.all([
    getConnectedAccounts(),
    AsyncStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY),
    getActiveSessionId(),
  ]);

  return (
    accounts.find((account) => account.id === activeAccountId) ??
    accounts.find((account) => account.sessionId === activeSessionId) ??
    null
  );
}

export async function hasConnectedInstagramAccount(): Promise<boolean> {
  return (await getActiveConnectedAccount()) !== null;
}

export async function removeConnectedAccount(sessionId: string): Promise<void> {
  const accounts = await getConnectedAccounts();
  const removed = accounts.find((account) => account.sessionId === sessionId);
  const updated = accounts.filter((account) => account.sessionId !== sessionId);

  if (removed) await deleteSecureValue(accountSessionKey(removed.id));
  await persistAccountMetadata(updated);

  if ((await getActiveSessionId()) === sessionId) {
    const nextActive = updated[0];
    if (nextActive) await setActiveSessionId(nextActive.sessionId);
    else await clearActiveSessionId();
  }
}

export async function clearAllConnectedAccounts(): Promise<void> {
  const accounts = await getConnectedAccounts();
  await Promise.all([
    ...accounts.map((account) => deleteSecureValue(accountSessionKey(account.id))),
    AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY),
    clearActiveSessionId(),
  ]);
}
