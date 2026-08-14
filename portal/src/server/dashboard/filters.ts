import type { Prisma, TituloTipo } from '@/generated/prisma';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import { parseCalendarDate } from '@/shared/format/date';

/** Única conta bancária considerada em todo o portal — confirmado com o
 * cliente que outras contas (ex.: contas pessoais/legado) nunca devem
 * entrar em nenhum KPI, gráfico ou listagem. */
const CONTA_BANCARIA_CONSIDERADA = 'Bradesco';

/**
 * Únicas formas de pagamento consideradas — as que de fato movimentam a
 * conta bancária. É uma lista de permissão (não de bloqueio) de propósito:
 * uma forma nova cadastrada no ERP fica de fora até ser avaliada, em vez de
 * entrar sozinha nos números.
 *
 * O motivo não é só espelhar o relatório nativo do Gestão Click (que aplica
 * exatamente este recorte): compra no cartão de crédito é lançada como
 * título próprio E aparece de novo na fatura do cartão, essa sim paga por
 * boleto saindo do Bradesco — contar as duas seria contar o mesmo gasto
 * duas vezes. Verificado em jan–jul/2026: eram 16 compras no cartão +
 * 1 em dinheiro, R$ 23.907,62 de dupla contagem.
 *
 * Cuidado ao revisar: "Cartão de Débito" e "Cheque" existem no cadastro do
 * ERP e movimentam a conta, mas hoje nenhum título os usa. Se passarem a
 * ser usados, precisam ser incluídos aqui.
 */
const FORMAS_PAGAMENTO_CONSIDERADAS = ['Boleto Bancário', 'PIX', 'Transferência Bancária'];

export interface BuildWhereOptions {
  tipo?: TituloTipo;
  /** Se true, aplica periodoInicio/periodoFim; algumas leituras (ex.: total
   * em aberto "hoje") ignoram período de propósito — ver kpis.ts. */
  aplicarPeriodo?: boolean;
  /** Sobrepõe o campo de data usado no filtro de período (padrão: decide pelo regime). */
  campoData?: 'dataVencimento' | 'dataCompetencia' | 'dataLiquidacao';
}

/**
 * Fonte única do "where" — reusado tanto pela agregação (valor do card)
 * quanto pelo drill-down (lista de registros), para o total nunca poder
 * divergir da soma da lista (ver plano: "Dashboard component architecture").
 */
export function buildTituloWhere(
  filters: DashboardFilters,
  options: BuildWhereOptions = {},
): Prisma.TituloWhereInput {
  const where: Prisma.TituloWhereInput = {
    contaBancaria: { nome: { equals: CONTA_BANCARIA_CONSIDERADA, mode: 'insensitive' } },
    formaPagamento: { nome: { in: FORMAS_PAGAMENTO_CONSIDERADAS } },
  };

  if (options.tipo) where.tipo = options.tipo;
  if (filters.empresaId) where.empresaId = filters.empresaId;
  if (filters.centroCustoId) where.centroCustoId = filters.centroCustoId;
  if (filters.clienteId) where.clienteId = filters.clienteId;
  if (filters.fornecedorId) where.fornecedorId = filters.fornecedorId;
  if (filters.categoriaId) where.categoriaId = filters.categoriaId;

  if (options.aplicarPeriodo && (filters.periodoInicio || filters.periodoFim)) {
    const campo = options.campoData ?? (filters.regime === 'caixa' ? 'dataVencimento' : 'dataCompetencia');
    where[campo] = {
      ...(filters.periodoInicio ? { gte: parseCalendarDate(filters.periodoInicio) } : {}),
      ...(filters.periodoFim ? { lte: parseCalendarDate(filters.periodoFim) } : {}),
    };
  }

  return where;
}
