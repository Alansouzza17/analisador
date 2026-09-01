export function validateInstagramSessionOwner(session, userId) {
  if (!session) return { ok: false, status: 401, error: "Sessão do Instagram inválida ou expirada" };
  if (!session.userId || session.userId !== userId) return { ok: false, status: 403, error: "A conta ativa não pertence ao usuário autenticado" };
  if (!session.profile?.id) return { ok: false, status: 400, error: "A sessão não possui uma conta do Instagram válida" };
  return { ok: true, instagramUserId: String(session.profile.id) };
}
