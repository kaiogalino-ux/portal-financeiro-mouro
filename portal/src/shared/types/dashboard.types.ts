import type { KpiKey } from '@/shared/schemas/dashboard.schema';

export interface KpiResult {
  key: KpiKey;
  valor: number;
  comparacaoMesAnterior: number | null;
  comparacaoAnoAnterior: number | null;
  isSimulated: boolean;
}

export interface TituloDrilldownRow {
  id: string;
  tipo: 'PAGAR' | 'RECEBER';
  descricao: string;
  contraparte: string;
  categoria: string | null;
  centroCusto: string | null;
  dataVencimento: string;
  dataLiquidacao: string | null;
  valorTotal: string;
  status: 'PREVISTO' | 'REALIZADO' | 'VENCIDO' | 'CANCELADO';
}

export interface DrilldownResult {
  rows: TituloDrilldownRow[];
  total: number;
  page: number;
  pageSize: number;
  isSimulated: boolean;
}

export interface SeriesPoint {
  label: string;
  entradas: number;
  saidas: number;
  saldoAcumulado: number;
}

export interface DonutSlice {
  nome: string;
  valor: number;
  percentual: number;
}

export type IndicadorPrevisaoNivel = 'excelente' | 'boa' | 'atencao' | 'critico' | 'neutro';

export interface IndicadorPrevisao {
  nome: string;
  valor: string;
  nivel: IndicadorPrevisaoNivel;
}

export const KPI_LABELS: Record<KpiKey, string> = {
  totalAPagar: 'Total a pagar',
  totalAReceber: 'Total a receber',
  titulosVencidos: 'Títulos vencidos',
  faturamentoDoMes: 'Faturamento do mês',
  receitasRealizadas: 'Receitas realizadas',
  despesasRealizadas: 'Despesas realizadas',
  resultadoDoPeriodo: 'Resultado do período',
  saldoProjetado: 'Saldo projetado',
  recebidoAteHoje: 'Recebido até hoje',
  gastoAteHoje: 'Gasto até hoje',
};

export const KPI_HELP: Record<KpiKey, string> = {
  totalAPagar:
    'Soma dos títulos a pagar ainda não liquidados com vencimento entre 01/12/2025 e o fim do mês atual. Não inclui vencimentos anteriores a dez/2025 nem posteriores ao mês vigente.',
  totalAReceber:
    'Soma dos títulos a receber ainda não liquidados com vencimento a partir de 01/01/2026 (atrasados + a vencer, sem limite de fim). Não inclui vencimentos anteriores a 2026.',
  titulosVencidos: 'Títulos (a pagar e a receber) com vencimento anterior a hoje e ainda não liquidados.',
  faturamentoDoMes: 'Soma do valor das notas fiscais emitidas com data de emissão no mês atual.',
  receitasRealizadas: 'Títulos a receber já liquidados dentro do período e regime selecionados.',
  despesasRealizadas: 'Títulos a pagar já liquidados dentro do período e regime selecionados.',
  resultadoDoPeriodo: 'Receitas realizadas menos despesas realizadas no período selecionado.',
  saldoProjetado:
    'Previsto a receber menos previsto a pagar (títulos em aberto) dentro do período selecionado. Não inclui saldo bancário real — sem integração de extrato nesta entrega.',
  recebidoAteHoje:
    'Soma dos títulos a receber já liquidados dentro do ano vigente, do dia 01/01 até o fim do último mês fechado. O mês vigente nunca entra, porque ainda pode receber baixas até terminar.',
  gastoAteHoje:
    'Soma dos títulos a pagar já liquidados dentro do ano vigente, do dia 01/01 até o fim do último mês fechado. O mês vigente nunca entra, porque ainda pode receber baixas até terminar.',
};
