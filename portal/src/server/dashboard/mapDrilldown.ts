import type { Titulo } from '@/generated/prisma';
import { computeTituloStatus } from '@/server/finance/tituloStatus';
import { todayInSaoPaulo } from '@/shared/format/date';
import type { TituloDrilldownRow } from '@/shared/types/dashboard.types';

type TituloComRelacoes = Titulo & {
  cliente: { nome: string } | null;
  fornecedor: { nome: string } | null;
  transportadora: { nome: string } | null;
  categoria: { nome: string } | null;
  centroCusto: { nome: string } | null;
};

export function mapTituloToDrilldownRow(titulo: TituloComRelacoes): TituloDrilldownRow {
  const contraparte =
    titulo.cliente?.nome ?? titulo.fornecedor?.nome ?? titulo.transportadora?.nome ?? titulo.nomeFuncionario ?? '—';

  return {
    id: titulo.id,
    tipo: titulo.tipo,
    descricao: titulo.descricao,
    contraparte,
    categoria: titulo.categoria?.nome ?? null,
    centroCusto: titulo.centroCusto?.nome ?? null,
    dataVencimento: titulo.dataVencimento.toISOString().slice(0, 10),
    dataLiquidacao: titulo.dataLiquidacao ? titulo.dataLiquidacao.toISOString().slice(0, 10) : null,
    valorTotal: titulo.valorTotal.toString(),
    status: computeTituloStatus(
      {
        liquidado: titulo.liquidado,
        dataVencimento: titulo.dataVencimento,
        dataLiquidacao: titulo.dataLiquidacao,
        dataCompetencia: titulo.dataCompetencia,
        canceladoEm: titulo.canceladoEm,
      },
      todayInSaoPaulo(),
    ),
  };
}

export const TITULO_DRILLDOWN_INCLUDE = {
  cliente: { select: { nome: true } },
  fornecedor: { select: { nome: true } },
  transportadora: { select: { nome: true } },
  categoria: { select: { nome: true } },
  centroCusto: { select: { nome: true } },
} as const;
