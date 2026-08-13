import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { kpiKeySchema } from '@/shared/schemas/dashboard.schema';
import { KPI_HELP, KPI_LABELS } from '@/shared/types/dashboard.types';

/**
 * Especificação OpenAPI 3.1 da API pública.
 *
 * Deliberadamente SEM autenticação: é só a descrição da interface, não
 * expõe nenhum dado. O ChatGPT (GPT Actions) precisa buscar esta URL sem
 * credencial para montar as ações — e a chave continua obrigatória em toda
 * chamada de dado.
 */
const PAGINACAO_PARAMS = [
  {
    name: 'page',
    in: 'query',
    description: 'Página (1 em diante).',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'pageSize',
    in: 'query',
    description: 'Registros por página (máx. 200).',
    schema: { type: 'integer', minimum: 1, maximum: 200, default: 25 },
  },
];

const FILTRO_PARAMS = [
  { name: 'empresaId', in: 'query', description: 'Filtra por empresa/CNPJ.', schema: { type: 'string' } },
  {
    name: 'periodoInicio',
    in: 'query',
    description: 'Início do período no formato AAAA-MM-DD.',
    schema: { type: 'string', format: 'date' },
  },
  {
    name: 'periodoFim',
    in: 'query',
    description: 'Fim do período no formato AAAA-MM-DD.',
    schema: { type: 'string', format: 'date' },
  },
  { name: 'centroCustoId', in: 'query', description: 'Filtra por centro de custo.', schema: { type: 'string' } },
  { name: 'categoriaId', in: 'query', description: 'Filtra por categoria financeira.', schema: { type: 'string' } },
  {
    name: 'regime',
    in: 'query',
    description: 'Regime contábil usado para agrupar por período.',
    schema: { type: 'string', enum: ['caixa', 'competencia'], default: 'caixa' },
  },
];

function respostaPaginada(descricao: string) {
  return {
    '200': {
      description: descricao,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              rows: { type: 'array', items: { type: 'object', additionalProperties: true } },
              total: { type: 'integer' },
              page: { type: 'integer' },
              pageSize: { type: 'integer' },
            },
          },
        },
      },
    },
  };
}

export function GET(request: NextRequest) {
  const baseUrl = process.env.PORTAL_PUBLIC_URL ?? request.nextUrl.origin;

  const descricaoIndicadores = kpiKeySchema.options
    .map((key) => `- \`${key}\` (${KPI_LABELS[key]}): ${KPI_HELP[key]}`)
    .join('\n');

  return NextResponse.json({
    openapi: '3.1.0',
    info: {
      title: 'Portal Financeiro Mouro — API',
      version: '1.0.0',
      description:
        'Consulta aos dados financeiros do Portal Financeiro Mouro Soluções, sincronizados do ERP Gestão Click. ' +
        'Todos os valores são em reais (BRL). Datas em AAAA-MM-DD.\n\n' +
        'Cada indicador segue uma regra de data própria, descrita no campo `descricao` da resposta — ' +
        'sempre cite a regra ao apresentar um número, para não induzir a leitura errada.',
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Chave de API criada em Integrações no portal. Envie como "Authorization: Bearer <token>".',
        },
      },
    },
    paths: {
      '/me': {
        get: {
          operationId: 'verificarChave',
          summary: 'Valida a chave de API e lista o que ela pode acessar.',
          responses: { '200': { description: 'Dados da chave autenticada.' } },
        },
      },
      '/kpis': {
        get: {
          operationId: 'listarIndicadores',
          summary: 'Todos os indicadores financeiros do painel.',
          description: `Indicadores disponíveis:\n${descricaoIndicadores}`,
          parameters: FILTRO_PARAMS,
          responses: { '200': { description: 'Lista de indicadores com valor, label e a regra de cálculo.' } },
        },
      },
      '/kpis/{indicador}': {
        get: {
          operationId: 'obterIndicador',
          summary: 'Um indicador específico, opcionalmente com os títulos que o compõem.',
          parameters: [
            {
              name: 'indicador',
              in: 'path',
              required: true,
              schema: { type: 'string', enum: [...kpiKeySchema.options] },
            },
            {
              name: 'detalhe',
              in: 'query',
              description: 'Se "true", inclui a lista de títulos que somam o valor.',
              schema: { type: 'string', enum: ['true', 'false'] },
            },
            ...FILTRO_PARAMS,
            ...PAGINACAO_PARAMS,
          ],
          responses: { '200': { description: 'Indicador, sua regra de cálculo e (opcional) o detalhamento.' } },
        },
      },
      '/contas-a-pagar': {
        get: {
          operationId: 'listarContasAPagar',
          summary: 'Títulos a pagar.',
          parameters: [...FILTRO_PARAMS, ...PAGINACAO_PARAMS],
          responses: respostaPaginada('Títulos a pagar do período.'),
        },
      },
      '/contas-a-receber': {
        get: {
          operationId: 'listarContasAReceber',
          summary: 'Títulos a receber.',
          parameters: [...FILTRO_PARAMS, ...PAGINACAO_PARAMS],
          responses: respostaPaginada('Títulos a receber do período.'),
        },
      },
      '/clientes': {
        get: {
          operationId: 'listarClientes',
          summary: 'Clientes cadastrados.',
          parameters: [
            { name: 'empresaId', in: 'query', schema: { type: 'string' } },
            { name: 'busca', in: 'query', description: 'Filtra por trecho do nome.', schema: { type: 'string' } },
            ...PAGINACAO_PARAMS,
          ],
          responses: respostaPaginada('Clientes.'),
        },
      },
      '/fornecedores': {
        get: {
          operationId: 'listarFornecedores',
          summary: 'Fornecedores cadastrados.',
          parameters: [
            { name: 'empresaId', in: 'query', schema: { type: 'string' } },
            { name: 'busca', in: 'query', description: 'Filtra por trecho do nome.', schema: { type: 'string' } },
            ...PAGINACAO_PARAMS,
          ],
          responses: respostaPaginada('Fornecedores.'),
        },
      },
      '/sincronizacoes': {
        get: {
          operationId: 'listarSincronizacoes',
          summary: 'Histórico de sincronizações com o Gestão Click.',
          parameters: [{ name: 'empresaId', in: 'query', schema: { type: 'string' } }, ...PAGINACAO_PARAMS],
          responses: respostaPaginada('Execuções de sincronização.'),
        },
        post: {
          operationId: 'dispararSincronizacao',
          summary: 'Atualiza os dados locais a partir do Gestão Click.',
          description:
            'Não altera nada no ERP — só traz para o portal o estado atual do Gestão Click. ' +
            'Leva cerca de um minuto e exige perfil Administrador ou Financeiro.',
          parameters: [{ name: 'empresaId', in: 'query', schema: { type: 'string' } }],
          responses: { '200': { description: 'Resumo da sincronização executada.' } },
        },
      },
    },
  });
}
