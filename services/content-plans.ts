import { getAuthToken } from "./auth-session";
import { apiRequest } from "./http";
import { getActiveSessionId } from "./session";

export type ContentType = "post" | "reels" | "story" | "carrossel";
export type ContentStatus = "ideia" | "planejado" | "publicado" | "cancelado";

export type ContentPlan = {
  id: string;
  instagramAccountId: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentPlanInput = {
  title: string;
  description?: string | null;
  contentType: ContentType;
  status: ContentStatus;
  scheduledAt?: string | null;
  publishedAt?: string | null;
};

async function credentials() {
  const [accessToken, sessionId] = await Promise.all([getAuthToken(), getActiveSessionId()]);
  if (!accessToken || !sessionId) throw new Error("Entre e conecte uma conta do Instagram para continuar.");
  return { accessToken, sessionId };
}

export async function getContentPlans(status?: ContentStatus) {
  const query = status ? `?status=${status}` : "";
  return apiRequest<{ items: ContentPlan[]; count: number }>(`/me/instagram/content-plans${query}`, await credentials());
}

export async function createContentPlan(input: ContentPlanInput) {
  return apiRequest<{ item: ContentPlan }>("/me/instagram/content-plans", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), ...(await credentials()),
  });
}

export async function updateContentPlan(id: string, input: Partial<ContentPlanInput>) {
  return apiRequest<{ item: ContentPlan }>(`/me/instagram/content-plans/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), ...(await credentials()),
  });
}

export async function deleteContentPlan(id: string) {
  return apiRequest<void>(`/me/instagram/content-plans/${id}`, { method: "DELETE", ...(await credentials()) });
}
