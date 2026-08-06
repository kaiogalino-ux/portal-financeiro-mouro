#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { GestaoClickClient, GestaoClickError, RESOURCES } from './gestaoClickClient.js';

const RESOURCE_NAMES = Object.values(RESOURCES);
const client = new GestaoClickClient();

const server = new McpServer({ name: 'gestaoclick', version: '1.0.0' });

function ok(resposta) {
  return { content: [{ type: 'text', text: JSON.stringify(resposta, null, 2) }] };
}

function fail(err) {
  if (err instanceof GestaoClickError) {
    return {
      content: [{ type: 'text', text: `Erro da API Gestão Click (HTTP ${err.status}): ${err.message}` }],
      isError: true,
    };
  }
  return { content: [{ type: 'text', text: `Erro: ${err.message}` }], isError: true };
}

server.tool(
  'gestaoclick_list',
  'Lista registros de um recurso do ERP Gestão Click, com paginação e filtros opcionais.',
  {
    resource: z.enum(RESOURCE_NAMES).describe('Recurso a listar (ex: clientes, vendas, recebimentos)'),
    pagina: z.number().int().positive().optional().describe('Número da página'),
    filtros: z.record(z.string()).optional().describe('Filtros extras enviados como query params, ex: {"nome": "João"}'),
  },
  async ({ resource, pagina, filtros }) => {
    try {
      return ok(await client.list(resource, { pagina, ...filtros }));
    } catch (err) {
      return fail(err);
    }
  }
);

server.tool(
  'gestaoclick_get',
  'Busca um registro específico de um recurso do Gestão Click pelo ID.',
  {
    resource: z.enum(RESOURCE_NAMES).describe('Recurso do registro'),
    id: z.string().describe('ID do registro'),
  },
  async ({ resource, id }) => {
    try {
      return ok(await client.get(resource, id));
    } catch (err) {
      return fail(err);
    }
  }
);

server.tool(
  'gestaoclick_create',
  'Cria um novo registro em um recurso do Gestão Click.',
  {
    resource: z.enum(RESOURCE_NAMES).describe('Recurso onde criar o registro'),
    dados: z.record(z.any()).describe('Campos do novo registro'),
  },
  async ({ resource, dados }) => {
    try {
      return ok(await client.create(resource, dados));
    } catch (err) {
      return fail(err);
    }
  }
);

server.tool(
  'gestaoclick_update',
  'Atualiza um registro existente em um recurso do Gestão Click.',
  {
    resource: z.enum(RESOURCE_NAMES).describe('Recurso do registro'),
    id: z.string().describe('ID do registro a atualizar'),
    dados: z.record(z.any()).describe('Campos a atualizar'),
  },
  async ({ resource, id, dados }) => {
    try {
      return ok(await client.update(resource, id, dados));
    } catch (err) {
      return fail(err);
    }
  }
);

server.tool(
  'gestaoclick_delete',
  'Remove um registro de um recurso do Gestão Click. Ação irreversível — use com cuidado.',
  {
    resource: z.enum(RESOURCE_NAMES).describe('Recurso do registro'),
    id: z.string().describe('ID do registro a remover'),
  },
  async ({ resource, id }) => {
    try {
      return ok(await client.remove(resource, id));
    } catch (err) {
      return fail(err);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
