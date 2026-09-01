import { getAuthToken } from "./auth-session";
import { apiRequest } from "./http";
import { getActiveSessionId } from "./session";

export type Opportunity = {
  id: string;
  title: string;
  explanation: string;
  source: string;
  action: string;
  priority: "alta" | "média" | "baixa";
  generatedAt: string;
};

export async function getOpportunities() {
  const [accessToken, sessionId] = await Promise.all([getAuthToken(), getActiveSessionId()]);
  if (!accessToken || !sessionId) throw new Error("Entre e conecte uma conta do Instagram para continuar.");
  return apiRequest<{ items: Opportunity[]; count: number; generatedAt: string; source: "deterministic-rules" }>("/me/instagram/opportunities", { accessToken, sessionId });
}
