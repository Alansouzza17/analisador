import { getAuthToken } from "./auth-session";
import { apiRequest } from "./http";
import { getActiveSessionId } from "./session";

export type InstagramSnapshot = {
  id: string;
  instagramAccountId: string;
  followersCount: number;
  followsCount: number;
  mediaCount: number;
  capturedAt: string;
  createdAt: string;
};

export type GrowthMetric = { start: number; end: number; absolute: number; percentage: number | null };

export type InstagramGrowth = {
  sufficientData: boolean;
  message: string | null;
  snapshotCount: number;
  period: { from: string; to: string } | null;
  followers: GrowthMetric | null;
  follows: GrowthMetric | null;
  media: GrowthMetric | null;
  followersActivity: { gained: number; lost: number; net: number } | null;
};

async function credentials() {
  const [accessToken, sessionId] = await Promise.all([getAuthToken(), getActiveSessionId()]);
  if (!accessToken) throw new Error("Entre na sua conta para acessar o histórico.");
  if (!sessionId) throw new Error("Conecte uma conta do Instagram para continuar.");
  return { accessToken, sessionId };
}

export async function captureSnapshot() {
  return apiRequest<{ snapshot: InstagramSnapshot; created: boolean }>("/me/instagram/snapshots", {
    method: "POST",
    ...(await credentials()),
  });
}

export async function getSnapshots(days = 30, limit = 30) {
  return apiRequest<{ snapshots: InstagramSnapshot[]; count: number }>(
    `/me/instagram/snapshots?days=${days}&limit=${limit}`,
    await credentials()
  );
}

export async function getGrowth(days = 30) {
  return apiRequest<InstagramGrowth>(`/me/instagram/growth?days=${days}&limit=365`, await credentials());
}
