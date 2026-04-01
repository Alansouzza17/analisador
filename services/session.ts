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