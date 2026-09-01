const DAY_MS = 24 * 60 * 60 * 1000;

function opportunity({ title, explanation, source, action, priority, generatedAt }) {
  return { id: `${title}-${source}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 100), title, explanation, source, action, priority, generatedAt };
}

export function buildOpportunities({ snapshots, contentPlans, now = new Date() }) {
  const generatedAt = now.toISOString();
  const ordered = [...snapshots].sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
  const results = [];
  const latest = ordered.at(-1);
  const previous = ordered.at(-2);

  if (!latest || now.getTime() - new Date(latest.capturedAt).getTime() >= 7 * DAY_MS) {
    const days = latest ? Math.floor((now.getTime() - new Date(latest.capturedAt).getTime()) / DAY_MS) : null;
    results.push(opportunity({ title: "Atualize os dados da conta", explanation: latest ? "A coleta mais recente já está desatualizada." : "A conta ainda não possui histórico de coleta.", source: days === null ? "Nenhuma coleta registrada" : `Última coleta há ${days} dias`, action: "Abra Monitoramento e faça uma nova coleta.", priority: "alta", generatedAt }));
  }

  if (latest && previous && latest.followersCount < previous.followersCount) {
    const loss = previous.followersCount - latest.followersCount;
    results.push(opportunity({ title: "Revise a queda recente de seguidores", explanation: "A contagem total diminuiu entre as duas últimas coletas. Esse dado não identifica quais perfis deixaram de seguir.", source: `Queda de ${loss} seguidores`, action: "Compare listas importadas para identificar mudanças individuais e revise o conteúdo recente.", priority: "alta", generatedAt }));
  }

  const planned = contentPlans.filter((item) => item.status === "planejado" && item.scheduledAt && new Date(item.scheduledAt) >= now);
  if (planned.length === 0) {
    results.push(opportunity({ title: "Planeje o próximo conteúdo", explanation: "Não há conteúdo futuro com status planejado no calendário.", source: "0 conteúdos planejados", action: "Adicione uma publicação futura no Calendário.", priority: "média", generatedAt }));
  }

  if (ordered.length >= 2) {
    const mediaChange = latest.mediaCount - previous.mediaCount;
    const elapsedDays = Math.max(1, (new Date(latest.capturedAt) - new Date(previous.capturedAt)) / DAY_MS);
    if (mediaChange === 0 && elapsedDays >= 7) {
      results.push(opportunity({ title: "Retome a frequência de publicação", explanation: "A contagem de publicações não aumentou entre as coletas recentes.", source: `0 novas publicações em aproximadamente ${Math.floor(elapsedDays)} dias`, action: "Escolha uma ideia do calendário e defina uma data realista.", priority: "média", generatedAt }));
    }

    const first = ordered[0];
    const totalDays = Math.max(1, (new Date(latest.capturedAt) - new Date(first.capturedAt)) / DAY_MS);
    const historicalRate = (latest.mediaCount - first.mediaCount) / totalDays;
    const recentRate = mediaChange / elapsedDays;
    if (ordered.length >= 3 && historicalRate > 0 && recentRate < historicalRate * 0.6) {
      results.push(opportunity({ title: "Frequência abaixo do histórico", explanation: "O ritmo recente de publicações está abaixo da média observada. Isso é uma comparação, não uma causa comprovada de mudanças em seguidores.", source: `${recentRate.toFixed(2)} publicação/dia recente versus ${historicalRate.toFixed(2)} histórica`, action: "Reavalie o calendário e ajuste a frequência ao que for sustentável.", priority: "baixa", generatedAt }));
    }
  }

  return results.sort((a, b) => ({ alta: 0, média: 1, baixa: 2 })[a.priority] - ({ alta: 0, média: 1, baixa: 2 })[b.priority]);
}
