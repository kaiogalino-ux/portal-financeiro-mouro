import type { TituloStatus } from '@/generated/prisma';

export type Regime = 'caixa' | 'competencia';

export interface TituloStatusFacts {
  liquidado: boolean;
  dataVencimento: Date;
  dataLiquidacao: Date | null;
  dataCompetencia: Date;
  canceladoEm: Date | null;
}

/**
 * Status nunca é uma coluna armazenada — é sempre calculado a partir dos
 * fatos (liquidado + datas), porque depende do calendário avançar, o que
 * uma coluna gravada não acompanharia sozinha. Ver plano: "Modelo de Dados".
 *
 * O status individual (PREVISTO/REALIZADO/VENCIDO/CANCELADO) é sempre
 * baseado em `liquidado` + `dataVencimento`, independente do regime — regime
 * caixa-vs-competência não muda se UM título está pago, só muda QUAL data
 * (dataLiquidacao vs dataCompetencia) é usada para agrupar títulos em
 * períodos nas agregações (ver src/server/dashboard/filters.ts). O parâmetro
 * `regime` existe aqui só para manter a mesma assinatura nos dois lugares.
 */
export function computeTituloStatus(facts: TituloStatusFacts, asOf: Date): TituloStatus {
  if (facts.canceladoEm) return 'CANCELADO';
  if (facts.liquidado) return 'REALIZADO';
  if (facts.dataVencimento.getTime() < asOf.getTime()) return 'VENCIDO';
  return 'PREVISTO';
}

export function isOverdue(facts: TituloStatusFacts, asOf: Date): boolean {
  return computeTituloStatus(facts, asOf) === 'VENCIDO';
}
