import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Carrega o .env a partir da raiz do projeto (não do cwd), já que o MCP
// server pode ser iniciado pelo Claude Code a partir de qualquer diretório.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(projectRoot, '.env') });

const BASE_URL = 'https://api.beteltecnologia.com';

// Recursos confirmados diretamente contra a API (respondem 401 sem token,
// em vez de 404). Outros nomes podem existir — confira a documentação
// dentro do próprio ERP (Configurações > API) se precisar de um recurso
// que não está nesta lista.
export const RESOURCES = {
  CLIENTES: 'clientes',
  PRODUTOS: 'produtos',
  VENDAS: 'vendas',
  RECEBIMENTOS: 'recebimentos',
  PAGAMENTOS: 'pagamentos',
  FORNECEDORES: 'fornecedores',
  SERVICOS: 'servicos',
  ORCAMENTOS: 'orcamentos',
  TRANSPORTADORAS: 'transportadoras',
  NOTAS_FISCAIS: 'notas_fiscais',
  COMPRAS: 'compras',
  CONTAS_BANCARIAS: 'contas_bancarias',
  FORMAS_PAGAMENTOS: 'formas_pagamentos',
  USUARIOS: 'usuarios',
};

export class GestaoClickError extends Error {
  constructor(message, { status, code, response } = {}) {
    super(message);
    this.name = 'GestaoClickError';
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

export class GestaoClickClient {
  constructor({ accessToken, secretAccessToken, baseUrl = BASE_URL } = {}) {
    this.accessToken = accessToken ?? process.env.GESTAOCLICK_ACCESS_TOKEN;
    this.secretAccessToken = secretAccessToken ?? process.env.GESTAOCLICK_SECRET_ACCESS_TOKEN;
    this.baseUrl = baseUrl;

    if (!this.accessToken || !this.secretAccessToken) {
      throw new Error(
        'Access token e secret access token são obrigatórios. Defina GESTAOCLICK_ACCESS_TOKEN ' +
          'e GESTAOCLICK_SECRET_ACCESS_TOKEN no arquivo .env, ou passe-os no construtor do cliente.'
      );
    }
  }

  async request(method, path, { query, body } = {}) {
    const qs = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) qs.set(key, value);
      }
    }
    const url = `${this.baseUrl}${path}${qs.toString() ? `?${qs}` : ''}`;

    const res = await fetch(url, {
      method,
      headers: {
        'access-token': this.accessToken,
        'secret-access-token': this.secretAccessToken,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const mensagem = payload?.data?.mensagem ?? payload?.mensagem ?? res.statusText;
      throw new GestaoClickError(mensagem, { status: res.status, code: payload?.code, response: payload });
    }

    return payload;
  }

  // Lista registros de um recurso. Ex: client.list(RESOURCES.CLIENTES, { pagina: 1 })
  list(resource, params = {}) {
    return this.request('GET', `/${resource}`, { query: params });
  }

  get(resource, id) {
    return this.request('GET', `/${resource}/${id}`);
  }

  create(resource, data) {
    return this.request('POST', `/${resource}`, { body: data });
  }

  update(resource, id, data) {
    return this.request('PUT', `/${resource}/${id}`, { body: data });
  }

  remove(resource, id) {
    return this.request('DELETE', `/${resource}/${id}`);
  }
}
