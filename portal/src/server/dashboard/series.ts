import { addMonths, endOfMonth, format, startOfMonth, startOfYear, subMonths } from 'date-fns';
import { prisma } from '@/server/db/prisma';
import { withAuthz } from '@/server/data-access/withAuthz';
import { formatMonthKeyLabel, todayInSaoPaulo } from '@/shared/format/date';
import { formatBRL } from '@/shared/format/currency';
import { fimDoUltimoMesFechado } from './period';

function formatDecimalPtBr(value: number, digits: number): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    value,
  );
}
import type { DashboardFilters } from '@/shared/schemas/dashboard.schema';
import type { DonutSlice, IndicadorPrevisao, SeriesPoint } from '@/shared/types/dashboard.types';
import { buildTituloWhere } from './filters';

function monthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

interface BucketAccum {
  entradas: number;
  saidas: number;
}

/**
 * Fluxo de caixa projetado: meses passados usam o realizado (liquidado),
 * meses futuros usam o previsto (títulos em aberto) — ambos pela data de
 * vencimento, que é a data relevante para "quando o dinheiro deve
 * entrar/saír" tanto para o que já aconteceu quanto para o que ainda vai.
 * O pivô do gráfico é o último mês FECHADO, não o mês vigente — o mês
 * vigente ainda pode receber baixas até terminar, então ele entra como o
 * primeiro mês "projetado", nunca como o último mês "realizado".
 */
export const getFluxoCaixaProjetado = withAuthz(
  'dashboard',
  'read',
  async (
    _session,
    filters: DashboardFilters,
    opts: { mesesAntes?: number; mesesDepois?: number } = {},
  ): Promise<SeriesPoint[]> => {
    const mesesAntes = opts.mesesAntes ?? 3;
    const mesesDepois = opts.mesesDepois ?? 6;
    const hoje = todayInSaoPaulo();
    const pivo = startOfMonth(fimDoUltimoMesFechado(hoje));
    const inicio = startOfMonth(subMonths(pivo, mesesAntes));
    const fim = endOfMonth(addMonths(pivo, mesesDepois));

    const titulos = await prisma.titulo.findMany({
      where: {
        ...buildTituloWhere(filters),
        dataVencimento: { gte: inicio, lte: fim },
      },
      select: { tipo: true, valorTotal: true, dataVencimento: true },
    });

    const buckets = new Map<string, BucketAccum>();
    for (let i = -mesesAntes; i <= mesesDepois; i++) {
      buckets.set(monthKey(addMonths(pivo, i)), { entradas: 0, saidas: 0 });
    }

    for (const titulo of titulos) {
      const key = monthKey(titulo.dataVencimento);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      const valor = Number(titulo.valorTotal.toString());
      if (titulo.tipo === 'RECEBER') bucket.entradas += valor;
      else bucket.saidas += valor;
    }

    let saldoAcumulado = 0;
    const pontos = Array.from(buckets.entries()).map(([key, bucket]) => {
      saldoAcumulado += bucket.entradas - bucket.saidas;
      return {
        label: formatMonthKeyLabel(key),
        entradas: bucket.entradas,
        saidas: bucket.saidas,
        saldoAcumulado,
      };
    });

    // Mês sem nenhum título a receber cadastrado ainda não é "previsão de
    // receita zero" — é ausência de dado (o ERP só emite a fatura perto do
    // vencimento, enquanto compromissos fixos a pagar já entram com
    // antecedência). Corta a cauda no último mês com alguma entrada, senão
    // o saldo acumulado despenca por falta de dado, não por risco real.
    let ultimoComEntrada = pontos.length - 1;
    while (ultimoComEntrada > 0 && pontos[ultimoComEntrada]?.entradas === 0) {
      ultimoComEntrada--;
    }
    return pontos.slice(0, ultimoComEntrada + 1);
  },
);

/**
 * Fluxo de caixa realizado do ano vigente, mês a mês — espelha exatamente a
 * regra de `recebidoAteHoje`/`gastoAteHoje` (ver kpis.ts: `ateHojeDef`): só
 * liquidado, por dataLiquidacao, de 01/01 do ano vigente até o fim do último
 * mês fechado (o mês vigente nunca entra — pode receber baixas até acabar).
 * A soma de todas as entradas aqui bate com "Receita (acumulada)"; a soma
 * das saídas bate com "Despesas (acumulada)" — este gráfico é o
 * detalhamento mês a mês do que esses dois KPIs somam num único número.
 *
 * Em janeiro (antes de qualquer mês do ano novo fechar), a janela fica
 * vazia de propósito — mesma hora em que `recebidoAteHoje`/`gastoAteHoje`
 * também zeram, porque ainda não existe nenhum mês fechado no ano vigente.
 */
export const getFluxoCaixaRealizadoAnoVigente = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters): Promise<SeriesPoint[]> => {
    const hoje = todayInSaoPaulo();
    const inicio = startOfYear(hoje);
    const fim = fimDoUltimoMesFechado(hoje);

    const titulos =
      inicio > fim
        ? []
        : await prisma.titulo.findMany({
            where: {
              ...buildTituloWhere(filters),
              liquidado: true,
              canceladoEm: null,
              dataLiquidacao: { gte: inicio, lte: fim },
            },
            select: { tipo: true, valorTotal: true, dataLiquidacao: true },
          });

    const buckets = new Map<string, BucketAccum>();
    for (let cursor = inicio; cursor <= fim; cursor = addMonths(cursor, 1)) {
      buckets.set(monthKey(cursor), { entradas: 0, saidas: 0 });
    }

    for (const titulo of titulos) {
      if (!titulo.dataLiquidacao) continue;
      const bucket = buckets.get(monthKey(titulo.dataLiquidacao));
      if (!bucket) continue;
      const valor = Number(titulo.valorTotal.toString());
      if (titulo.tipo === 'RECEBER') bucket.entradas += valor;
      else bucket.saidas += valor;
    }

    let saldoAcumulado = 0;
    return Array.from(buckets.entries()).map(([key, bucket]) => {
      saldoAcumulado += bucket.entradas - bucket.saidas;
      return { label: formatMonthKeyLabel(key), ...bucket, saldoAcumulado };
    });
  },
);

/** Evolução mensal — só realizado, últimos N meses inteiramente fechados
 * (o mês vigente nunca entra — ver fimDoUltimoMesFechado). */
export const getEvolucaoMensalRealizada = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters, meses: number = 6): Promise<SeriesPoint[]> => {
    const fimJanela = fimDoUltimoMesFechado(todayInSaoPaulo());
    const inicio = startOfMonth(subMonths(fimJanela, meses - 1));

    const campoData = filters.regime === 'caixa' ? 'dataLiquidacao' : 'dataCompetencia';
    const titulos = await prisma.titulo.findMany({
      where: {
        ...buildTituloWhere(filters),
        liquidado: true,
        [campoData]: { gte: inicio, lte: fimJanela },
      },
      select: { tipo: true, valorTotal: true, dataLiquidacao: true, dataCompetencia: true },
    });

    const buckets = new Map<string, BucketAccum>();
    for (let i = meses - 1; i >= 0; i--) {
      buckets.set(monthKey(subMonths(fimJanela, i)), { entradas: 0, saidas: 0 });
    }

    for (const titulo of titulos) {
      const referencia = campoData === 'dataLiquidacao' ? titulo.dataLiquidacao : titulo.dataCompetencia;
      if (!referencia) continue;
      const bucket = buckets.get(monthKey(referencia));
      if (!bucket) continue;
      const valor = Number(titulo.valorTotal.toString());
      if (titulo.tipo === 'RECEBER') bucket.entradas += valor;
      else bucket.saidas += valor;
    }

    let saldoAcumulado = 0;
    return Array.from(buckets.entries()).map(([key, bucket]) => {
      saldoAcumulado += bucket.entradas - bucket.saidas;
      return { label: formatMonthKeyLabel(key), ...bucket, saldoAcumulado };
    });
  },
);

function toDonutSlices(entries: Array<{ nome: string; valor: number }>, limite = 5): DonutSlice[] {
  const total = entries.reduce((soma, e) => soma + e.valor, 0);
  const ordenado = [...entries].sort((a, b) => b.valor - a.valor);
  const principais = ordenado.slice(0, limite);
  const outros = ordenado.slice(limite).reduce((soma, e) => soma + e.valor, 0);
  const resultado = outros > 0 ? [...principais, { nome: 'Outros', valor: outros }] : principais;
  return resultado.map((e) => ({ nome: e.nome, valor: e.valor, percentual: total > 0 ? e.valor / total : 0 }));
}

export const getPrincipaisClientes = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters): Promise<DonutSlice[]> => {
    const titulos = await prisma.titulo.findMany({
      where: { ...buildTituloWhere(filters, { tipo: 'RECEBER', aplicarPeriodo: true }) },
      select: { valorTotal: true, cliente: { select: { nome: true } } },
    });
    const porCliente = new Map<string, number>();
    for (const t of titulos) {
      const nome = t.cliente?.nome ?? 'Sem cliente identificado';
      porCliente.set(nome, (porCliente.get(nome) ?? 0) + Number(t.valorTotal.toString()));
    }
    return toDonutSlices(Array.from(porCliente.entries()).map(([nome, valor]) => ({ nome, valor })));
  },
);

export const getPrincipaisFornecedores = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters): Promise<DonutSlice[]> => {
    const titulos = await prisma.titulo.findMany({
      where: { ...buildTituloWhere(filters, { tipo: 'PAGAR', aplicarPeriodo: true }) },
      select: { valorTotal: true, fornecedor: { select: { nome: true } } },
    });
    const porFornecedor = new Map<string, number>();
    for (const t of titulos) {
      const nome = t.fornecedor?.nome ?? 'Sem fornecedor identificado';
      porFornecedor.set(nome, (porFornecedor.get(nome) ?? 0) + Number(t.valorTotal.toString()));
    }
    return toDonutSlices(Array.from(porFornecedor.entries()).map(([nome, valor]) => ({ nome, valor })));
  },
);

export const getResultadoPorCentroCusto = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters): Promise<Array<{ nome: string; resultado: number }>> => {
    const campoData = filters.regime === 'caixa' ? 'dataLiquidacao' : 'dataCompetencia';
    const titulos = await prisma.titulo.findMany({
      where: { ...buildTituloWhere(filters, { aplicarPeriodo: true, campoData }), liquidado: true },
      select: { tipo: true, valorTotal: true, centroCusto: { select: { nome: true } } },
    });
    const porCentro = new Map<string, number>();
    for (const t of titulos) {
      const nome = t.centroCusto?.nome ?? 'Sem centro de custo';
      const valor = Number(t.valorTotal.toString());
      const delta = t.tipo === 'RECEBER' ? valor : -valor;
      porCentro.set(nome, (porCentro.get(nome) ?? 0) + delta);
    }
    return Array.from(porCentro.entries())
      .map(([nome, resultado]) => ({ nome, resultado }))
      .sort((a, b) => b.resultado - a.resultado);
  },
);

/**
 * Indicadores inspirados no painel "Indicadores de Previsão" do dashboard de
 * referência. Fórmulas simples e explicáveis — não são um modelo
 * atuarial, servem para dar um sinal rápido em reunião de diretoria.
 */
export const getIndicadoresPrevisao = withAuthz(
  'dashboard',
  'read',
  async (_session, filters: DashboardFilters): Promise<IndicadorPrevisao[]> => {
    const [aReceberAberto, aPagarAberto, despesasUltimos3Meses] = await Promise.all([
      prisma.titulo.aggregate({
        where: { ...buildTituloWhere(filters, { tipo: 'RECEBER' }), liquidado: false },
        _sum: { valorTotal: true },
      }),
      prisma.titulo.aggregate({
        where: { ...buildTituloWhere(filters, { tipo: 'PAGAR' }), liquidado: false },
        _sum: { valorTotal: true },
      }),
      prisma.titulo.aggregate({
        where: {
          ...buildTituloWhere(filters, { tipo: 'PAGAR' }),
          liquidado: true,
          dataLiquidacao: { gte: subMonths(todayInSaoPaulo(), 3) },
        },
        _sum: { valorTotal: true },
      }),
    ]);

    const receber = Number(aReceberAberto._sum.valorTotal?.toString() ?? 0);
    const pagar = Number(aPagarAberto._sum.valorTotal?.toString() ?? 0);
    const despesaMensalMedia = Number(despesasUltimos3Meses._sum.valorTotal?.toString() ?? 0) / 3;

    const liquidez = pagar > 0 ? receber / pagar : receber > 0 ? Number.POSITIVE_INFINITY : 1;
    const coberturaMeses = despesaMensalMedia > 0 ? (receber - pagar) / despesaMensalMedia : 0;

    const fluxo = await getFluxoCaixaProjetado(filters);
    const pontoAtencao = fluxo.find((ponto) => ponto.saldoAcumulado < 0);
    const necessidadeCapital = Math.min(0, ...fluxo.map((p) => p.saldoAcumulado));

    return [
      {
        nome: 'Liquidez projetada (a receber / a pagar em aberto)',
        valor: Number.isFinite(liquidez) ? formatDecimalPtBr(liquidez, 2) : '—',
        nivel: liquidez >= 1.3 ? 'excelente' : liquidez >= 1 ? 'boa' : liquidez >= 0.7 ? 'atencao' : 'critico',
      },
      {
        nome: 'Cobertura de despesas fixas (meses)',
        valor: `${formatDecimalPtBr(coberturaMeses, 1)} meses`,
        nivel: coberturaMeses >= 3 ? 'excelente' : coberturaMeses >= 1 ? 'boa' : 'atencao',
      },
      {
        nome: 'Ponto de atenção',
        valor: pontoAtencao ? pontoAtencao.label : 'Nenhum no período',
        nivel: pontoAtencao ? 'atencao' : 'boa',
      },
      {
        nome: 'Necessidade de capital',
        valor: necessidadeCapital < 0 ? formatBRL(Math.abs(necessidadeCapital)) : 'R$ 0,00',
        nivel: necessidadeCapital < 0 ? 'critico' : 'boa',
      },
    ];
  },
);
