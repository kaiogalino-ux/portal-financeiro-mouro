import { z } from 'zod';

export const regimeSchema = z.enum(['caixa', 'competencia']);

export const dashboardFiltersSchema = z.object({
  empresaId: z.string().optional(),
  periodoInicio: z.string().optional(),
  periodoFim: z.string().optional(),
  centroCustoId: z.string().optional(),
  clienteId: z.string().optional(),
  fornecedorId: z.string().optional(),
  categoriaId: z.string().optional(),
  regime: regimeSchema.default('caixa'),
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;

export const kpiKeySchema = z.enum([
  'totalAPagar',
  'totalAReceber',
  'titulosVencidos',
  'faturamentoDoMes',
  'receitasRealizadas',
  'despesasRealizadas',
  'resultadoDoPeriodo',
  'saldoProjetado',
  'recebidoAteHoje',
  'gastoAteHoje',
]);

export type KpiKey = z.infer<typeof kpiKeySchema>;

export const drilldownQuerySchema = dashboardFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});
