#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/**
 * Servidor MCP do Portal Financeiro Mouro.
 *
 * Não fala com o banco direto de propósito — consome a mesma API /api/v1 que
 * qualquer outra integração usa. Assim a matriz de permissão do perfil da
 * chave (RBAC) vale igual aqui, e não existe um caminho paralelo de acesso a
 * dado que possa divergir das regras da API.
 *
 * Configuração (variáveis de ambiente):
 *   PORTAL_API_URL    — base do portal (padrão http://localhost:3000)
 *   PORTAL_API_TOKEN  — chave criada em Integrações no portal (obrigatória)
 */

const BASE_URL = (process.env.PORTAL_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN = process.env.PORTAL_API_TOKEN;

if (!TOKEN) {
  console.error(
    'PORTAL_API_TOKEN não definido. Crie uma chave em Integrações no portal e informe-a na configuração do MCP.',
  );
  process.exit(1);
}

async function chamarApi(caminho, { metodo = 'GET', params = {} } = {}) {
  const url = new URL(`${BASE_URL}/api/v1${caminho}`);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(chave, String(valor));
  }

  const resposta = await fetch(url, {
    method: metodo,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  });

  const texto = await resposta.text();
  let corpo;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    throw new Error(`Resposta não-JSON do portal (HTTP ${resposta.status}): ${texto.slice(0, 200)}`);
  }

  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}: ${corpo?.erro ?? 'erro desconhecido'}`);
  }
  return corpo;
}

function ok(dados) {
  return { content: [{ type: 'text', text: JSON.stringify(dados, null, 2) }] };
}

function falha(erro) {
  return { content: [{ type: 'text', text: `Erro: ${erro.message}` }], isError: true };
}

/** Envolve o handler para que qualquer erro vire resposta de erro do MCP,
 * em vez de derrubar o servidor no meio de uma conversa. */
function ferramenta(handler) {
  return async (args) => {
    try {
      return ok(await handler(args ?? {}));
    } catch (erro) {
      return falha(erro);
    }
  };
}

const filtrosComuns = {
  empresaId: z.string().optional().describe('Filtra por empresa/CNPJ.'),
  periodoInicio: z.string().optional().describe('Início do período, formato AAAA-MM-DD.'),
  periodoFim: z.string().optional().describe('Fim do período, formato AAAA-MM-DD.'),
  centroCustoId: z.string().optional().describe('Filtra por centro de custo.'),
  categoriaId: z.string().optional().describe('Filtra por categoria financeira.'),
  regime: z.enum(['caixa', 'competencia']).optional().describe('Regime usado para agrupar por período.'),
};

const paginacao = {
  page: z.number().int().positive().optional().describe('Página (1 em diante).'),
  pageSize: z.number().int().min(1).max(200).optional().describe('Registros por página (máx. 200).'),
};

const server = new McpServer({ name: 'portal-financeiro-mouro', version: '1.0.0' });

server.tool(
  'portal_verificar_conexao',
  'Confirma que a chave de API do portal é válida e mostra quais recursos ela pode acessar. Use isto primeiro ao diagnosticar problemas de acesso.',
  {},
  ferramenta(() => chamarApi('/me')),
);

server.tool(
  'portal_indicadores',
  'Retorna todos os indicadores financeiros do painel (total a pagar, total a receber, recebido/gasto até hoje, títulos vencidos, etc). Cada indicador vem com a regra de cálculo que o define — sempre cite essa regra ao apresentar o número ao usuário.',
  filtrosComuns,
  ferramenta((args) => chamarApi('/kpis', { params: args })),
);

server.tool(
  'portal_indicador_detalhe',
  'Retorna um indicador específico e, opcionalmente, a lista de títulos que compõem o valor — útil para responder "de onde vem esse número?".',
  {
    indicador: z
      .enum([
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
      ])
      .describe('Qual indicador consultar.'),
    detalhe: z.boolean().optional().describe('Se verdadeiro, inclui os títulos que somam o valor.'),
    ...filtrosComuns,
    ...paginacao,
  },
  ferramenta(({ indicador, detalhe, ...resto }) =>
    chamarApi(`/kpis/${indicador}`, { params: { ...resto, detalhe: detalhe ? 'true' : undefined } }),
  ),
);

server.tool(
  'portal_contas_a_pagar',
  'Lista os títulos a pagar do período, com fornecedor, vencimento, valor e situação.',
  { ...filtrosComuns, ...paginacao },
  ferramenta((args) => chamarApi('/contas-a-pagar', { params: args })),
);

server.tool(
  'portal_contas_a_receber',
  'Lista os títulos a receber do período, com cliente, vencimento, valor e situação.',
  { ...filtrosComuns, ...paginacao },
  ferramenta((args) => chamarApi('/contas-a-receber', { params: args })),
);

server.tool(
  'portal_clientes',
  'Lista os clientes cadastrados, opcionalmente filtrando por trecho do nome.',
  { busca: z.string().optional().describe('Trecho do nome para filtrar.'), empresaId: z.string().optional(), ...paginacao },
  ferramenta((args) => chamarApi('/clientes', { params: args })),
);

server.tool(
  'portal_fornecedores',
  'Lista os fornecedores cadastrados, opcionalmente filtrando por trecho do nome.',
  { busca: z.string().optional().describe('Trecho do nome para filtrar.'), empresaId: z.string().optional(), ...paginacao },
  ferramenta((args) => chamarApi('/fornecedores', { params: args })),
);

server.tool(
  'portal_sincronizacoes',
  'Mostra o histórico de sincronizações com o Gestão Click — quando rodou, quantos registros vieram e se houve falha. Use para saber o quão atuais são os dados.',
  { empresaId: z.string().optional(), ...paginacao },
  ferramenta((args) => chamarApi('/sincronizacoes', { params: args })),
);

server.tool(
  'portal_sincronizar_agora',
  'Atualiza os dados do portal a partir do Gestão Click. Não altera nada no ERP — apenas traz o estado atual para o portal. Demora cerca de um minuto. Use quando o usuário disser que um valor está desatualizado.',
  { empresaId: z.string().optional() },
  ferramenta((args) => chamarApi('/sincronizacoes', { metodo: 'POST', params: args })),
);

const transport = new StdioServerTransport();
await server.connect(transport);
