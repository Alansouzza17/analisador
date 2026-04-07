import AsyncStorage from "@react-native-async-storage/async-storage";

export type ConnectedAccount = {
  id: string;
  username: string;
  sessionId: string;
  profilePictureUrl?: string;
  connectedAt: number;
};

export const ACCOUNTS_STORAGE_KEY = "@instagram_accounts";
export const ACTIVE_ACCOUNT_STORAGE_KEY = "@instagram_active_account";

export async function getConnectedAccounts(): Promise<ConnectedAccount[]> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveConnectedAccount(account: ConnectedAccount) {
  const accounts = await getConnectedAccounts();

  const filtered = accounts.filter((item) => item.id !== account.id);
  const updated = [account, ...filtered];

  await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  await AsyncStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, account.sessionId);
}

export async function getActiveSessionId(): Promise<string | null> {
  return await AsyncStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export async function setActiveSessionId(sessionId: string) {
  await AsyncStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, sessionId);
}

export async function clearActiveSessionId() {
  await AsyncStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
}

export async function getActiveConnectedAccount(): Promise<ConnectedAccount | null> {
  const [accounts, activeSessionId] = await Promise.all([
    getConnectedAccounts(),
    getActiveSessionId(),
  ]);

  if (!activeSessionId) return null;

  return (
    accounts.find((account) => account.sessionId === activeSessionId) ?? null
  );
}

export async function hasConnectedInstagramAccount(): Promise<boolean> {
  const activeAccount = await getActiveConnectedAccount();
  return !!activeAccount;
}

export async function removeConnectedAccount(sessionId: string) {
  const accounts = await getConnectedAccounts();
  const updated = accounts.filter((account) => account.sessionId !== sessionId);

  await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));

  const active = await getActiveSessionId();

  if (active === sessionId) {
    const nextActive = updated.length > 0 ? updated[0].sessionId : null;

    if (nextActive) {
      await setActiveSessionId(nextActive);
    } else {
      await clearActiveSessionId();
    }
  }
}

export async function clearAllConnectedAccounts() {
  await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  await clearActiveSessionId();
}