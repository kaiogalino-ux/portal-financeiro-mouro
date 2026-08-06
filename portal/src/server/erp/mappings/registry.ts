import { z } from 'zod';
import { Prisma, type TituloTipo } from '@/generated/prisma';
import { prisma } from '@/server/db/prisma';
import type { ErpResourceName } from '../types';

export interface MapContext {
  empresaId: string;
  syncRunId: string;
}

export interface MapOutcome {
  created: boolean;
}

/** Todo campo numérico do ERP chega como string — nunca usar float. */
function toDecimal(value: unknown): Prisma.Decimal {
  return new Prisma.Decimal(String(value ?? '0') || '0');
}

function toDateOrNull(value: unknown): Date | null {
  if (!value || value === '') return null;
  return new Date(`${value}T00:00:00`);
}

function toDate(value: unknown): Date {
  const date = toDateOrNull(value);
  if (!date) throw new Error(`Data inválida/ausente: ${String(value)}`);
  return date;
}

const pessoaSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    nome: z.string(),
    razao_social: z.string().optional(),
    cnpj: z.string().optional(),
    cpf: z.string().optional(),
    email: z.string().optional(),
    telefone: z.string().optional(),
  })
  .passthrough();

const simplesSchema = z
  .object({ id: z.union([z.string(), z.number()]).transform(String), nome: z.string() })
  .passthrough();

const tituloSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    codigo: z.string().optional(),
    descricao: z.string(),
    valor: z.union([z.string(), z.number()]),
    juros: z.union([z.string(), z.number()]).optional(),
    desconto: z.union([z.string(), z.number()]).optional(),
    taxa_banco: z.union([z.string(), z.number()]).optional(),
    taxa_operadora: z.union([z.string(), z.number()]).optional(),
    valor_total: z.union([z.string(), z.number()]),
    plano_contas_id: z.string().optional(),
    nome_plano_conta: z.string().optional(),
    centro_custo_id: z.string().optional(),
    nome_centro_custo: z.string().optional(),
    conta_bancaria_id: z.string().optional(),
    nome_conta_bancaria: z.string().optional(),
    forma_pagamento_id: z.string().optional(),
    nome_forma_pagamento: z.string().optional(),
    entidade: z.string().optional(),
    fornecedor_id: z.string().optional(),
    cliente_id: z.string().optional(),
    transportadora_id: z.string().optional(),
    funcionario_id: z.string().optional(),
    nome_funcionario: z.string().optional(),
    loja_id: z.string().optional(),
    nome_loja: z.string().optional(),
    liquidado: z.string(),
    data_vencimento: z.string(),
    data_liquidacao: z.string().optional(),
    data_competencia: z.string().optional(),
    cadastrado_em: z.string().optional(),
    modificado_em: z.string().optional(),
  })
  .passthrough();

const notaFiscalSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    numero: z.string().optional(),
    serie: z.string().optional(),
    situacao: z.string().optional(),
    valor: z.union([z.string(), z.number()]).optional(),
    cliente_id: z.string().optional(),
    data_emissao: z.string().optional(),
  })
  .passthrough();

async function upsertPessoa(
  model: 'cliente' | 'fornecedor',
  raw: unknown,
  ctx: MapContext,
): Promise<MapOutcome> {
  const parsed = pessoaSchema.parse(raw);
  const existing = await (prisma[model] as typeof prisma.cliente).findUnique({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    select: { id: true },
  });

  const data = {
    empresaId: ctx.empresaId,
    erpId: parsed.id,
    nome: parsed.nome,
    documento: parsed.cnpj || parsed.cpf || null,
    email: parsed.email || null,
    telefone: parsed.telefone || null,
    raw: parsed as Prisma.InputJsonValue,
  };

  await (prisma[model] as typeof prisma.cliente).upsert({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    create: data,
    update: data,
  });

  return { created: !existing };
}

async function upsertSimples(
  model: 'transportadora' | 'formaPagamento' | 'contaBancariaErp',
  raw: unknown,
  ctx: MapContext,
): Promise<MapOutcome> {
  const parsed = simplesSchema.parse(raw);
  const existing = await (prisma[model] as typeof prisma.transportadora).findUnique({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    select: { id: true },
  });

  const data = {
    empresaId: ctx.empresaId,
    erpId: parsed.id,
    nome: parsed.nome,
    raw: parsed as Prisma.InputJsonValue,
  };

  await (prisma[model] as typeof prisma.transportadora).upsert({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    create: data,
    update: data,
  });

  return { created: !existing };
}

/** categoria/centro de custo vêm embutidos no título, não em endpoint próprio. */
async function upsertCategoriaEmbutida(erpId: string | undefined, nome: string | undefined, ctx: MapContext) {
  if (!erpId || !nome) return null;
  const categoria = await prisma.categoriaFinanceira.upsert({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId } },
    create: { empresaId: ctx.empresaId, erpId, nome, raw: { nome } },
    update: { nome },
  });
  return categoria.id;
}

async function upsertCentroCustoEmbutido(erpId: string | undefined, nome: string | undefined, ctx: MapContext) {
  if (!erpId || !nome) return null;
  const centro = await prisma.centroCusto.upsert({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId } },
    create: { empresaId: ctx.empresaId, erpId, nome, raw: { nome } },
    update: { nome },
  });
  return centro.id;
}

async function findLocalId(
  model: 'cliente' | 'fornecedor' | 'transportadora' | 'formaPagamento' | 'contaBancariaErp',
  erpId: string | undefined,
  ctx: MapContext,
): Promise<string | null> {
  if (!erpId) return null;
  const row = await (prisma[model] as typeof prisma.cliente).findUnique({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId } },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function upsertTitulo(tipo: TituloTipo, raw: unknown, ctx: MapContext): Promise<MapOutcome> {
  const parsed = tituloSchema.parse(raw);

  const [categoriaId, centroCustoId, contaBancariaId, formaPagamentoId, clienteId, fornecedorId, transportadoraId] =
    await Promise.all([
      upsertCategoriaEmbutida(parsed.plano_contas_id, parsed.nome_plano_conta, ctx),
      upsertCentroCustoEmbutido(parsed.centro_custo_id, parsed.nome_centro_custo, ctx),
      findLocalId('contaBancariaErp', parsed.conta_bancaria_id, ctx),
      findLocalId('formaPagamento', parsed.forma_pagamento_id, ctx),
      findLocalId('cliente', parsed.cliente_id, ctx),
      findLocalId('fornecedor', parsed.fornecedor_id, ctx),
      findLocalId('transportadora', parsed.transportadora_id, ctx),
    ]);

  const liquidado = parsed.liquidado === '1';
  const entidadeTipo = fornecedorId ? 'FORNECEDOR' : clienteId ? 'CLIENTE' : transportadoraId ? 'TRANSPORTADORA' : 'OUTROS';

  const existing = await prisma.titulo.findUnique({
    where: { empresaId_tipo_erpId: { empresaId: ctx.empresaId, tipo, erpId: parsed.id } },
    select: { id: true },
  });

  const data = {
    empresaId: ctx.empresaId,
    tipo,
    erpId: parsed.id,
    codigo: parsed.codigo ?? null,
    descricao: parsed.descricao,
    valorOriginal: toDecimal(parsed.valor),
    juros: toDecimal(parsed.juros ?? 0),
    desconto: toDecimal(parsed.desconto ?? 0),
    taxaBanco: toDecimal(parsed.taxa_banco ?? 0),
    taxaOperadora: toDecimal(parsed.taxa_operadora ?? 0),
    valorTotal: toDecimal(parsed.valor_total),
    categoriaId,
    centroCustoId,
    contaBancariaId,
    formaPagamentoId,
    entidadeTipo: entidadeTipo as never,
    clienteId,
    fornecedorId,
    transportadoraId,
    funcionarioErpId: parsed.funcionario_id || null,
    nomeFuncionario: parsed.nome_funcionario || null,
    lojaErpId: parsed.loja_id || null,
    nomeLoja: parsed.nome_loja || null,
    liquidado,
    dataVencimento: toDate(parsed.data_vencimento),
    dataLiquidacao: toDateOrNull(parsed.data_liquidacao),
    dataCompetencia: toDateOrNull(parsed.data_competencia) ?? toDate(parsed.data_vencimento),
    raw: parsed as Prisma.InputJsonValue,
    erpCriadoEm: toDateOrNull(parsed.cadastrado_em?.slice(0, 10)),
    erpModificadoEm: toDateOrNull(parsed.modificado_em?.slice(0, 10)),
    lastSyncRunId: ctx.syncRunId,
  };

  await prisma.titulo.upsert({
    where: { empresaId_tipo_erpId: { empresaId: ctx.empresaId, tipo, erpId: parsed.id } },
    create: data,
    update: data,
  });

  return { created: !existing };
}

async function upsertNotaFiscal(raw: unknown, ctx: MapContext): Promise<MapOutcome> {
  const parsed = notaFiscalSchema.parse(raw);
  const clienteId = await findLocalId('cliente', parsed.cliente_id, ctx);

  const existing = await prisma.notaFiscal.findUnique({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    select: { id: true },
  });

  const data = {
    empresaId: ctx.empresaId,
    erpId: parsed.id,
    numero: parsed.numero ?? null,
    serie: parsed.serie ?? null,
    situacao: parsed.situacao ?? null,
    valor: parsed.valor !== undefined ? toDecimal(parsed.valor) : null,
    dataEmissao: toDateOrNull(parsed.data_emissao),
    clienteId,
    raw: parsed as Prisma.InputJsonValue,
  };

  await prisma.notaFiscal.upsert({
    where: { empresaId_erpId: { empresaId: ctx.empresaId, erpId: parsed.id } },
    create: data,
    update: data,
  });

  return { created: !existing };
}

/** Resources com mapeamento de campo confirmado — os demais só vão para ErpRawRecord. */
export const MAPPED_RESOURCES: ErpResourceName[] = [
  'clientes',
  'fornecedores',
  'transportadoras',
  'formas_pagamentos',
  'contas_bancarias',
  'pagamentos',
  'recebimentos',
  'notas_fiscais',
];

export async function mapAndUpsert(resource: ErpResourceName, raw: unknown, ctx: MapContext): Promise<MapOutcome> {
  switch (resource) {
    case 'clientes':
      return upsertPessoa('cliente', raw, ctx);
    case 'fornecedores':
      return upsertPessoa('fornecedor', raw, ctx);
    case 'transportadoras':
      return upsertSimples('transportadora', raw, ctx);
    case 'formas_pagamentos':
      return upsertSimples('formaPagamento', raw, ctx);
    case 'contas_bancarias':
      return upsertSimples('contaBancariaErp', raw, ctx);
    case 'pagamentos':
      return upsertTitulo('PAGAR', raw, ctx);
    case 'recebimentos':
      return upsertTitulo('RECEBER', raw, ctx);
    case 'notas_fiscais':
      return upsertNotaFiscal(raw, ctx);
    default:
      throw new Error(`Recurso "${resource}" não tem mapeamento — deveria ir para ErpRawRecord.`);
  }
}
