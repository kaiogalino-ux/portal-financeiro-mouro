import { addYears } from 'date-fns';
import { prisma } from '@/server/db/prisma';
import { withAuthz } from '@/server/data-access/withAuthz';
import { todayInSaoPaulo } from '@/shared/format/date';
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { KpiKey } from '@/shared/schemas/dashboard.schema';
import type { DrilldownResult, KpiResult } from '@/shared/types/dashboard.types';
import { getIsDataSimulated } from './dataProvenance';
import { buildTituloWhere } from './filters';
import { mapTituloToDrilldownRow, TITULO_DRILLDOWN_INCLUDE } from './mapDrilldown';
import { percentChange, shiftPeriod, withDefaultPeriod } from './period';

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

// Contas a pagar: em aberto, do passado até hoje (não conta parcelas futuras
// que ainda não venceram). Contas a receber: em aberto, até 1 ano para
// frente (regra diferente das duas, confirmada com o cliente).
const totalAPagarDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters, { tipo: 'PAGAR' }),
      liquidado: false,
      dataVencimento: { lte: todayInSaoPaulo() },
    }),
};

const totalAReceberDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters, { tipo: 'RECEBER' }),
      liquidado: false,
      dataVencimento: { lte: addYears(todayInSaoPaulo(), 1) },
    }),
};

const titulosVencidosDef: KpiDefinition = {
  comparavel: false,
  valor: (filters) =>
    sumValorTotal({
      ...buildTituloWhere(filters),
      liquidado: false,
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

const saldoProjetadoDef: KpiDefinition = {
  comparavel: false,
  valor: async (filters) => {
    const [aReceber, aPagar] = await Promise.all([
      sumValorTotal({
        ...buildTituloWhere(filters, { tipo: 'RECEBER', aplicarPeriodo: true }),
        liquidado: false,
      }),
      sumValorTotal({
        ...buildTituloWhere(filters, { tipo: 'PAGAR', aplicarPeriodo: true }),
        liquidado: false,
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
      return { ...buildTituloWhere(filters, { tipo: 'PAGAR' }), liquidado: false, dataVencimento: { lte: hoje } };
    case 'totalAReceber':
      return {
        ...buildTituloWhere(filters, { tipo: 'RECEBER' }),
        liquidado: false,
        dataVencimento: { lte: addYears(hoje, 1) },
      };
    case 'titulosVencidos':
      return { ...buildTituloWhere(filters), liquidado: false, dataVencimento: { lt: hoje } };
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
      };
    case 'faturamentoDoMes':
      return null; // usa notaFiscal, não titulo — ver getKpiDetalhe abaixo.
  }
}

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
