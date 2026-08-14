import { endOfMonth, startOfYear } from 'date-fns';
import { prisma } from '@/server/db/prisma';
import { withAuthz } from '@/server/data-access/withAuthz';
import { todayInSaoPaulo } from '@/shared/format/date';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { KpiKey } from '@/shared/schemas/dashboard.schema';
import type { DrilldownResult, KpiMesValor, KpiResult } from '@/shared/types/dashboard.types';
import { getIsDataSimulated } from './dataProvenance';
import { buildTituloWhere } from './filters';
import { mapTituloToDrilldownRow, TITULO_DRILLDOWN_INCLUDE } from './mapDrilldown';
import { fimDoUltimoMesFechado, percentChange, shiftPeriod, withDefaultPeriod } from './period';

function toNumber(value: { toString(): string } | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

async function sumValorTotal(where: Parameters<typeof prisma.titulo.aggregate>[0]['where']) {
  const result = await prisma.titulo.aggregate({ where, _sum: { valorTotal: true } });
  return toNumber(result._sum.valorTotal);
}

interface KpiDefinition {
  /** Calcula o valor bruto (sem comparação) para um dado filtro. */
  valor: (filters: DashboardFilters) => Promise<number>;
  /** Comparações mês anterior/ano anterior fazem sentido só para KPIs de período. */
  comparavel: boolean;
}

// Contas a pagar: em aberto, com vencimento a partir de dez/2025 até o fim
// do mês vigente (regra confirmada com o cliente). Contas a receber: em
// aberto, com vencimento a partir de 01/01/2026, sem limite de fim — corta
// legado anterior a 2026, mas conta tudo dali pra frente (regra confirmada
// com o cliente).
const TOTAL_A_PAGAR_INICIO = new Date('2025-12-01T00:00:00');
const TOTAL_A_RECEBER_INICIO = new Date('2026-01-01T00:00:00');

const totalAPagarDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters, { tipo: 'PAGAR' }),
      liquidado: false,
      canceladoEm: null,
      dataVencimento: { gte: TOTAL_A_PAGAR_INICIO, lte: endOfMonth(todayInSaoPaulo()) },
    }),
};

const totalAReceberDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters, { tipo: 'RECEBER' }),
      liquidado: false,
      canceladoEm: null,
      dataVencimento: { gte: TOTAL_A_RECEBER_INICIO },
    }),
};

const titulosVencidosDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters),
      liquidado: false,
      canceladoEm: null,
      dataVencimento: { lt: todayInSaoPaulo() },
    }),
};

const faturamentoDoMesDef: KpiDefinition = {
  comparavel: true,
  valor: async (filters) => {
    const { periodoInicio, periodoFim } = withDefaultPeriod(filters);
    const result = await prisma.notaFiscal.aggregate({
      where: {
        empresaId: filters.empresaId,
        dataEmissao: {
          gte: periodoInicio ? new Date(`${periodoInicio}T00:00:00`) : undefined,
          lte: periodoFim ? new Date(`${periodoFim}T23:59:59`) : undefined,
        },
      },
      _sum: { valor: true },
    });
    return toNumber(result._sum.valor);
  },
};

function realizadoDef(tipo: 'PAGAR' | 'RECEBER'): KpiDefinition {
  return {
    comparavel: true,
    valor: (filters) => {
      const regime = filters.regime;
      const campoData = regime === 'caixa' ? 'dataLiquidacao' : 'dataCompetencia';
      return sumValorTotal({
        ...buildTituloWhere(filters, { tipo, aplicarPeriodo: true, campoData }),
        liquidado: true,
      });
    },
  };
}

const receitasRealizadasDef = realizadoDef('RECEBER');
const despesasRealizadasDef = realizadoDef('PAGAR');

const resultadoDoPeriodoDef: KpiDefinition = {
  comparavel: true,
  valor: async (filters) => {
    const [receitas, despesas] = await Promise.all([
      receitasRealizadasDef.valor(filters),
      despesasRealizadasDef.valor(filters),
    ]);
    return receitas - despesas;
  },
};

/** Acumulado do ano vigente, só meses inteiramente fechados — de 01/01 do
 * ano corrente até o fim do último mês encerrado (o mês vigente nunca
 * conta, porque ainda pode receber baixas até o fim dele). Diferente de
 * receitasRealizadas/despesasRealizadas, que olham o período selecionado
 * nos filtros, não o ano vigente. */
function ateHojeDef(tipo: 'PAGAR' | 'RECEBER'): KpiDefinition {
  return {
    comparavel: false,
    valor: (filters) => {
      const hoje = todayInSaoPaulo();
      return sumValorTotal({
        ...buildTituloWhere(filters, { tipo }),
        liquidado: true,
        canceladoEm: null,
        dataLiquidacao: { gte: startOfYear(hoje), lte: fimDoUltimoMesFechado(hoje) },
      });
    },
  };
}

const recebidoAteHojeDef = ateHojeDef('RECEBER');
const gastoAteHojeDef = ateHojeDef('PAGAR');

const saldoProjetadoDef: KpiDefinition = {
  comparavel: false,
  valor: async (filters) => {
    const [aReceber, aPagar] = await Promise.all([
      sumValorTotal({
        ...buildTituloWhere(filters, { tipo: 'RECEBER', aplicarPeriodo: true }),
        liquidado: false,
        canceladoEm: null,
      }),
      sumValorTotal({
        ...buildTituloWhere(filters, { tipo: 'PAGAR', aplicarPeriodo: true }),
        liquidado: false,
        canceladoEm: null,
      }),
    ]);
    return aReceber - aPagar;
  },
};

const KPI_DEFINITIONS: Record<KpiKey, KpiDefinition> = {
  totalAPagar: totalAPagarDef,
  totalAReceber: totalAReceberDef,
  titulosVencidos: titulosVencidosDef,
  faturamentoDoMes: faturamentoDoMesDef,
  receitasRealizadas: receitasRealizadasDef,
  despesasRealizadas: despesasRealizadasDef,
  resultadoDoPeriodo: resultadoDoPeriodoDef,
  saldoProjetado: saldoProjetadoDef,
  recebidoAteHoje: recebidoAteHojeDef,
  gastoAteHoje: gastoAteHojeDef,
};

export const getKpi = withAuthz(
  'dashboard',
  'read',
  async (_session, key: KpiKey, filters: DashboardFilters): Promise<KpiResult> => {
    const def = KPI_DEFINITIONS[key];
    const [valor, isSimulated] = await Promise.all([def.valor(filters), getIsDataSimulated()]);

    let comparacaoMesAnterior: number | null = null;
    let comparacaoAnoAnterior: number | null = null;

    if (def.comparavel) {
      const [mesAnterior, anoAnterior] = await Promise.all([
        def.valor(shiftPeriod(filters, 'mesAnterior')),
        def.valor(shiftPeriod(filters, 'anoAnterior')),
      ]);
      comparacaoMesAnterior = percentChange(valor, mesAnterior);
      comparacaoAnoAnterior = percentChange(valor, anoAnterior);
    }

    return { key, valor, comparacaoMesAnterior, comparacaoAnoAnterior, isSimulated };
  },
);

/** Where equivalente ao usado por cada KPI — a mesma função que soma é a que lista. */
function detailWhereFor(key: KpiKey, filters: DashboardFilters) {
  const hoje = todayInSaoPaulo();
  switch (key) {
    case 'totalAPagar':
      return {
        ...buildTituloWhere(filters, { tipo: 'PAGAR' }),
        liquidado: false,
        canceladoEm: null,
        dataVencimento: { gte: TOTAL_A_PAGAR_INICIO, lte: endOfMonth(hoje) },
      };
    case 'totalAReceber':
      return {
        ...buildTituloWhere(filters, { tipo: 'RECEBER' }),
        liquidado: false,
        canceladoEm: null,
        dataVencimento: { gte: TOTAL_A_RECEBER_INICIO },
      };
    case 'titulosVencidos':
      return {
        ...buildTituloWhere(filters),
        liquidado: false,
        canceladoEm: null,
        dataVencimento: { lt: hoje },
      };
    case 'receitasRealizadas':
      return {
        ...buildTituloWhere(filters, {
          tipo: 'RECEBER',
          aplicarPeriodo: true,
          campoData: filters.regime === 'caixa' ? 'dataLiquidacao' : 'dataCompetencia',
        }),
        liquidado: true,
      };
    case 'despesasRealizadas':
      return {
        ...buildTituloWhere(filters, {
          tipo: 'PAGAR',
          aplicarPeriodo: true,
          campoData: filters.regime === 'caixa' ? 'dataLiquidacao' : 'dataCompetencia',
        }),
        liquidado: true,
      };
    case 'resultadoDoPeriodo':
      return {
        ...buildTituloWhere(filters, { aplicarPeriodo: true }),
        liquidado: true,
      };
    case 'saldoProjetado':
      return {
        ...buildTituloWhere(filters, { aplicarPeriodo: true }),
        liquidado: false,
        canceladoEm: null,
      };
    case 'recebidoAteHoje':
      return {
        ...buildTituloWhere(filters, { tipo: 'RECEBER' }),
        liquidado: true,
        canceladoEm: null,
        dataLiquidacao: { gte: startOfYear(hoje), lte: fimDoUltimoMesFechado(hoje) },
      };
    case 'gastoAteHoje':
      return {
        ...buildTituloWhere(filters, { tipo: 'PAGAR' }),
        liquidado: true,
        canceladoEm: null,
        dataLiquidacao: { gte: startOfYear(hoje), lte: fimDoUltimoMesFechado(hoje) },
      };
    case 'faturamentoDoMes':
      return null; // usa notaFiscal, não titulo — ver getKpiDetalhe abaixo.
  }
}

/**
 * Quebra o total de um card por mês de vencimento — o "quando" que o número
 * cheio esconde: "Contas a Receber R$ 653 mil" não diz se entra este mês ou
 * daqui a seis.
 *
 * Reusa `detailWhereFor`, o mesmo `where` do card e do drill-down, então a
 * soma das fatias é sempre exatamente o valor mostrado — nunca duas leituras
 * concorrentes da mesma regra.
 *
 * Agrupa pelos componentes locais da data (não por `toISOString`) porque as
 * datas são gravadas como meia-noite local: converter para UTC empurraria um
 * vencimento de 1º de setembro para agosto num servidor a leste de Greenwich.
 */
export const getKpiPorMesVencimento = withAuthz(
  'dashboard',
  'read',
  async (_session, key: KpiKey, filters: DashboardFilters): Promise<KpiMesValor[]> => {
    const where = detailWhereFor(key, filters);
    if (!where) return [];

    const titulos = await prisma.titulo.findMany({
      where,
      select: { dataVencimento: true, valorTotal: true },
    });

    const porMes = new Map<string, number>();
    for (const titulo of titulos) {
      const mes = `${titulo.dataVencimento.getFullYear()}-${String(titulo.dataVencimento.getMonth() + 1).padStart(2, '0')}`;
      porMes.set(mes, (porMes.get(mes) ?? 0) + toNumber(titulo.valorTotal));
    }

    return [...porMes.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ mes, valor }));
  },
);

export const getKpiDetalhe = withAuthz(
  'dashboard',
  'read',
  async (
    _session,
    key: KpiKey,
    filters: DashboardFilters,
    pagination: { page: number; pageSize: number },
  ): Promise<DrilldownResult> => {
    if (key === 'faturamentoDoMes') {
      const { periodoInicio, periodoFim } = withDefaultPeriod(filters);
      const where = {
        empresaId: filters.empresaId,
        dataEmissao: {
          gte: periodoInicio ? new Date(`${periodoInicio}T00:00:00`) : undefined,
          lte: periodoFim ? new Date(`${periodoFim}T23:59:59`) : undefined,
        },
      };
      const [notas, total] = await Promise.all([
        prisma.notaFiscal.findMany({
          where,
          include: { cliente: { select: { nome: true } } },
          orderBy: { dataEmissao: 'desc' },
          skip: (pagination.page - 1) * pagination.pageSize,
          take: pagination.pageSize,
        }),
        prisma.notaFiscal.count({ where }),
      ]);
      return {
        rows: notas.map((n) => ({
          id: n.id,
          tipo: 'RECEBER' as const,
          descricao: `NF ${n.numero ?? n.erpId}`,
          contraparte: n.cliente?.nome ?? '—',
          categoria: null,
          centroCusto: null,
          dataVencimento: (n.dataEmissao ?? n.createdAt).toISOString().slice(0, 10),
          dataLiquidacao: null,
          valorTotal: (n.valor ?? 0).toString(),
          status: 'REALIZADO' as const,
        })),
        total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        isSimulated: await getIsDataSimulated(),
      };
    }

    // key !== 'faturamentoDoMes' aqui — esse caso já retornou acima.
    const where = detailWhereFor(key, filters)!;
    const [titulos, total] = await Promise.all([
      prisma.titulo.findMany({
        where,
        include: TITULO_DRILLDOWN_INCLUDE,
        orderBy: { dataVencimento: 'asc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.titulo.count({ where }),
    ]);

    return {
      rows: titulos.map(mapTituloToDrilldownRow),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      isSimulated: await getIsDataSimulated(),
    };
  },
);
