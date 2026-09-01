import { getAuthToken } from "./auth-session";
import { apiRequest } from "./http";
import { getActiveSessionId } from "./session";

export type Competitor = {
  id: string;
  instagramAccountId: string;
  username: string;
  displayName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  metricsAvailable: false;
};

export type CompetitorInput = { username: string; displayName?: string | null; notes?: string | null };

async function credentials() {
  const [accessToken, sessionId] = await Promise.all([getAuthToken(), getActiveSessionId()]);
  if (!accessToken || !sessionId) throw new Error("Entre e conecte uma conta do Instagram para continuar.");
  return { accessToken, sessionId };
}

export async function getCompetitors() {
  return apiRequest<{ items: Competitor[]; count: number; metricsAvailable: false }>("/me/instagram/competitors", await credentials());
}

export async function createCompetitor(input: CompetitorInput) {
  return apiRequest<{ item: Competitor }>("/me/instagram/competitors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), ...(await credentials()) });
}

export async function updateCompetitor(id: string, input: CompetitorInput) {
  return apiRequest<{ item: Competitor }>(`/me/instagram/competitors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), ...(await credentials()) });
}

export async function deleteCompetitor(id: string) {
  return apiRequest<void>(`/me/instagram/competitors/${id}`, { method: "DELETE", ...(await credentials()) });
}
