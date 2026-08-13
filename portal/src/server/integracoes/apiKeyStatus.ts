export type ApiKeyStatus = 'ATIVA' | 'REVOGADA' | 'EXPIRADA';

export interface ApiKeyStatusFacts {
  ativo: boolean;
  revogadoEm: Date | null;
  expiraEm: Date | null;
}

/**
 * Como o status de título (ver server/finance/tituloStatus.ts), o status de
 * uma chave nunca é coluna armazenada: "expirada" depende só do calendário
 * avançar, e um valor gravado ficaria desatualizado sozinho.
 */
export function computeApiKeyStatus(facts: ApiKeyStatusFacts, asOf: Date): ApiKeyStatus {
  if (facts.revogadoEm || !facts.ativo) return 'REVOGADA';
  if (facts.expiraEm && facts.expiraEm.getTime() < asOf.getTime()) return 'EXPIRADA';
  return 'ATIVA';
}
