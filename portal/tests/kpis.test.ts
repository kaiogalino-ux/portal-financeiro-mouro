import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KpiKey } from '@/shared/schemas/dashboard.schema';

/** Só o que os testes inspecionam — o `where` que cada KPI monta. */
interface WhereKpi {
  tipo?: string;
  liquidado?: boolean;
  canceladoEm?: Date | null;
  contaBancaria?: { nome: { equals: string } };
  formaPagamento?: { nome: { in: string[] } };
  dataVencimento?: { gte?: Date; lte?: Date; lt?: Date };
  // `lte` do totalAPagar é sempre preenchido; tipado opcional só porque
  // totalAReceber usa o mesmo campo sem teto de fim.
  dataLiquidacao?: { gte: Date; lte: Date };
  dataCompetencia?: { gte?: Date; lte?: Date };
}

/** Só os campos que `getKpiPorMesVencimento` seleciona. */
interface TituloParaQuebra {
  dataVencimento: Date;
  valorTotal: number;
}

const aggregate = vi.fn(async (_args: { where: WhereKpi }) => ({ _sum: { valorTotal: null } }));
const findMany = vi.fn(async (_args: { where: WhereKpi }): Promise<TituloParaQuebra[]> => []);
const count = vi.fn(async (_args: { where: WhereKpi }) => 0);

vi.mock('@/server/db/prisma', () => ({
  prisma: {
    titulo: { aggregate, findMany, count },
    notaFiscal: { aggregate, findMany, count },
    syncRun: { findFirst: async () => ({ isSimulated: false }) },
  },
}));

vi.mock('@/server/auth/auth', () => ({
  auth: async () => ({ user: { id: 'u1', role: 'ADMINISTRADOR', active: true } }),
}));

const { getKpi, getKpiDetalhe, getKpiPorMesVencimento } = await import('@/server/dashboard/kpis');

const FILTROS = { regime: 'caixa' as const };

function primeiroWhere(chamadas: [{ where: WhereKpi }][], origem: string): WhereKpi {
  const primeira = chamadas.at(0);
  if (!primeira) throw new Error(`nenhuma consulta disparada por ${origem}`);
  return primeira[0].where;
}

/** `where` da agregação que produz o valor do card. */
async function whereDoCard(key: KpiKey): Promise<WhereKpi> {
  aggregate.mockClear();
  await getKpi(key, FILTROS);
  return primeiroWhere(aggregate.mock.calls, `getKpi(${key})`);
}

/** `where` da listagem que abre ao clicar no card. */
async function whereDoDrilldown(key: KpiKey): Promise<WhereKpi> {
  findMany.mockClear();
  await getKpiDetalhe(key, FILTROS, { page: 1, pageSize: 25 });
  return primeiroWhere(findMany.mock.calls, `getKpiDetalhe(${key})`);
}

beforeEach(() => {
  aggregate.mockClear();
  findMany.mockClear();
  count.mockClear();
});

describe('recorte comum a todos os KPIs de título', () => {
  const KEYS: KpiKey[] = [
    'totalAPagar',
    'totalAReceber',
    'titulosVencidos',
    'recebidoAteHoje',
    'gastoAteHoje',
    'receitasRealizadas',
    'despesasRealizadas',
  ];

  it.each(KEYS)('%s considera só a conta Bradesco e formas que movimentam ela', async (key) => {
    const where = await whereDoCard(key);
    expect(where.contaBancaria!.nome.equals).toBe('Bradesco');
    // Lista de permissão: compra no cartão é lançada como título próprio E
    // reaparece na fatura paga por boleto — contar as duas dobraria o gasto.
    expect(where.formaPagamento!.nome.in).toEqual(['Boleto Bancário', 'PIX', 'Transferência Bancária']);
  });
});

describe('recebidoAteHoje / gastoAteHoje', () => {
  it('soma só o que foi liquidado, pela data de liquidação', async () => {
    const where = await whereDoCard('recebidoAteHoje');
    expect(where.tipo).toBe('RECEBER');
    expect(where.liquidado).toBe(true);
    expect(where.dataLiquidacao).toBeDefined();
    expect(where.dataVencimento).toBeUndefined();
  });

  it('começa em 01/01 do ano vigente e para no fim do último mês fechado', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T12:00:00Z'));
    try {
      const { gte, lte } = (await whereDoCard('recebidoAteHoje')).dataLiquidacao!;
      expect(gte.getFullYear()).toBe(2026);
      expect(gte.getMonth()).toBe(0);
      expect(gte.getDate()).toBe(1);
      // O mês vigente nunca entra — ainda pode receber baixas até acabar.
      expect(lte.getMonth()).toBe(6);
      expect(lte.getDate()).toBe(31);
    } finally {
      vi.useRealTimers();
    }
  });

  it('exclui títulos cancelados', async () => {
    // Regressão: uma NF da PRIO duplicada, apagada no ERP e marcada como
    // CANCELADA pela reconciliação, inflava este card em R$ 35.755,67.
    expect((await whereDoCard('recebidoAteHoje')).canceladoEm).toBeNull();
    expect((await whereDoCard('gastoAteHoje')).canceladoEm).toBeNull();
  });

  it('gastoAteHoje é o espelho do recebido, no tipo PAGAR', async () => {
    const where = await whereDoCard('gastoAteHoje');
    expect(where.tipo).toBe('PAGAR');
    expect(where.liquidado).toBe(true);
  });
});

describe('totais em aberto', () => {
  it('totalAPagar conta de 01/12/2025 até o fim do mês vigente, por vencimento', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-14T12:00:00Z'));
    try {
      const where = await whereDoCard('totalAPagar');
      expect(where.liquidado).toBe(false);
      expect(where.canceladoEm).toBeNull();
      expect(where.dataVencimento!.gte).toEqual(new Date('2025-12-01T00:00:00'));
      // Ao contrário do "até hoje", aqui o mês vigente entra inteiro.
      expect(where.dataVencimento!.lte!.getMonth()).toBe(7);
      expect(where.dataVencimento!.lte!.getDate()).toBe(31);
    } finally {
      vi.useRealTimers();
    }
  });

  it('totalAReceber conta de 01/01/2026 em diante, sem teto de fim', async () => {
    const where = await whereDoCard('totalAReceber');
    expect(where.liquidado).toBe(false);
    expect(where.canceladoEm).toBeNull();
    expect(where.dataVencimento!.gte).toEqual(new Date('2026-01-01T00:00:00'));
    expect(where.dataVencimento!.lte).toBeUndefined();
  });

  it('titulosVencidos pega os dois tipos, vencidos e não liquidados', async () => {
    const where = await whereDoCard('titulosVencidos');
    expect(where.tipo).toBeUndefined();
    expect(where.liquidado).toBe(false);
    expect(where.canceladoEm).toBeNull();
    expect(where.dataVencimento!.lt).toBeDefined();
  });
});

describe('getKpiPorMesVencimento', () => {
  const titulo = (dataVencimento: string, valorTotal: number): TituloParaQuebra => ({
    dataVencimento: new Date(`${dataVencimento}T00:00:00`),
    valorTotal,
  });

  it('agrupa por mês de vencimento e devolve em ordem cronológica', async () => {
    findMany.mockResolvedValueOnce([
      titulo('2026-09-10', 100),
      titulo('2026-08-05', 30),
      titulo('2026-09-25', 400),
      titulo('2026-08-20', 70),
    ]);

    expect(await getKpiPorMesVencimento('totalAReceber', FILTROS)).toEqual([
      { mes: '2026-08', valor: 100 },
      { mes: '2026-09', valor: 500 },
    ]);
  });

  it('usa o mesmo where do card, para a soma das partes ser sempre o total', async () => {
    findMany.mockClear();
    await getKpiPorMesVencimento('totalAPagar', FILTROS);
    const whereDaQuebra = primeiroWhere(findMany.mock.calls, 'getKpiPorMesVencimento(totalAPagar)');

    expect(whereDaQuebra).toEqual(await whereDoCard('totalAPagar'));
  });

  it('não escorrega de mês na virada, independente do fuso do servidor', async () => {
    // Agrupar por toISOString jogaria 01/09 para agosto num servidor a leste
    // de Greenwich, porque a data é gravada como meia-noite local.
    findMany.mockResolvedValueOnce([titulo('2026-09-01', 10), titulo('2026-08-31', 20)]);

    expect(await getKpiPorMesVencimento('totalAReceber', FILTROS)).toEqual([
      { mes: '2026-08', valor: 20 },
      { mes: '2026-09', valor: 10 },
    ]);
  });

  it('devolve vazio para KPI que não soma títulos', async () => {
    expect(await getKpiPorMesVencimento('faturamentoDoMes', FILTROS)).toEqual([]);
  });
});

describe('card e drill-down nunca divergem', () => {
  const KEYS: KpiKey[] = [
    'totalAPagar',
    'totalAReceber',
    'titulosVencidos',
    'recebidoAteHoje',
    'gastoAteHoje',
    'receitasRealizadas',
    'despesasRealizadas',
  ];

  // O total do card tem que ser exatamente a soma da lista que abre ao
  // clicar nele — uma regra, uma implementação.
  it.each(KEYS)('%s usa o mesmo where na soma e na listagem', async (key) => {
    expect(await whereDoDrilldown(key)).toEqual(await whereDoCard(key));
  });
});
