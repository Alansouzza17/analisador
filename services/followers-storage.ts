import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveConnectedAccount } from "./session";

const LEGACY_KEYS = {
  followers: "@followers_importados",
  following: "@following_importados",
  previousFollowers: "@followers_importados_anterior",
  lastApiFollowers: "@last_api_followers_count",
  lastApiFollowing: "@last_api_following_count",
  comparisonReady: "@followers_comparison_ready",
  updateWarningReady: "@update_warning_ready",
} as const;

export type FollowerStorageKeys = Record<keyof typeof LEGACY_KEYS, string>;

export async function getFollowerStorageKeys(): Promise<FollowerStorageKeys> {
  const account = await getActiveConnectedAccount();
  const scope = account?.id || "manual";
  const entries = Object.entries(LEGACY_KEYS).map(([name, key]) => [
    name,
    `${key}:${scope}`,
  ]);
  const scopedKeys = Object.fromEntries(entries) as FollowerStorageKeys;

  const scopedValues = await AsyncStorage.multiGet(Object.values(scopedKeys));
  if (scopedValues.some(([, value]) => value !== null)) return scopedKeys;

  const legacyValues = await AsyncStorage.multiGet(Object.values(LEGACY_KEYS));
  const valuesToMigrate = legacyValues.filter(([, value]) => value !== null);
  if (valuesToMigrate.length > 0) {
    const legacyToScoped = new Map<string, string>(
      Object.keys(LEGACY_KEYS).map((name) => [
        LEGACY_KEYS[name as keyof typeof LEGACY_KEYS],
        scopedKeys[name as keyof FollowerStorageKeys],
      ])
    );
    await AsyncStorage.multiSet(
      valuesToMigrate.map(([key, value]) => [legacyToScoped.get(key)!, value!])
    );
    await AsyncStorage.multiRemove(valuesToMigrate.map(([key]) => key));
  }

  return scopedKeys;
}
