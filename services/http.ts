import { API_URL } from "./api";
import { removeConnectedAccount } from "./session";

const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function messageForStatus(status: number, serverMessage?: string): string {
  if (status === 401) return "Sua sessão expirou. Conecte o Instagram novamente.";
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  if (status === 404) return "O recurso solicitado não está disponível.";
  if (status === 429) return "Muitas solicitações. Aguarde um momento e tente novamente.";
  if (status >= 500) return "O servidor está indisponível. Tente novamente em instantes.";
  return serverMessage || "Não foi possível concluir a solicitação.";
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { sessionId?: string | null; timeoutMs?: number } = {}
): Promise<T> {
  const { sessionId, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...requestInit } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...requestInit,
      signal: controller.signal,
      headers: {
        ...(sessionId ? { "x-session-id": sessionId } : {}),
        ...headers,
      },
    });
    const text = await response.text();
    let data: unknown = null;

    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new ApiError(
          response.ok
            ? "O servidor retornou uma resposta inválida."
            : messageForStatus(response.status),
          response.status
        );
      }
    }

    if (!response.ok) {
      const serverMessage =
        data && typeof data === "object" && "error" in data
          ? String(data.error)
          : undefined;
      if (response.status === 401 && sessionId) {
        await removeConnectedAccount(sessionId);
      }
      throw new ApiError(messageForStatus(response.status, serverMessage), response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("A solicitação demorou demais. Tente novamente.");
    }
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua internet.");
  } finally {
    clearTimeout(timeout);
  }
}
