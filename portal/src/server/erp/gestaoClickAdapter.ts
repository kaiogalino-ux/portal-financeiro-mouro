import type { ErpAdapter, ErpListMeta, ErpListParams, ErpListResult, ErpResourceName } from './types';

/**
 * Adaptador real do Gestão Click (Betel Tecnologia) — validado contra a API
 * de produção em tarefa anterior desta mesma sessão (ver
 * ../../../src/gestaoClickClient.js na raiz do repo, fora de portal/).
 * Fatos confirmados por chamadas HTTP reais, não documentação:
 *  - Base URL https://api.beteltecnologia.com
 *  - Headers `access-token` / `secret-access-token`
 *  - Envelope { code, status, data, meta } — meta.total_paginas/pagina_atual/total_registros/limite_por_pagina
 *  - `pagamentos`/`recebimentos`: sem data_inicio/data_fim só devolve uma janela
 *    recente; com eles, filtra por data_liquidacao quando liquidado="1" e por
 *    data_vencimento quando liquidado="0".
 */

const BASE_URL = 'https://api.beteltecnologia.com';

class GestaoClickError extends Error {
  retryable: boolean;
  status: number;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'GestaoClickError';
    this.status = status;
    this.retryable = retryable;
  }
}

const DATE_WINDOW_RESOURCES: ErpResourceName[] = ['pagamentos', 'recebimentos'];

export class GestaoClickAdapter implements ErpAdapter {
  readonly name = 'gestao-click';
  readonly isSimulated = false;

  private readonly accessToken: string;
  private readonly secretAccessToken: string;

  constructor() {
    const accessToken = process.env.GESTAOCLICK_ACCESS_TOKEN;
    const secretAccessToken = process.env.GESTAOCLICK_SECRET_ACCESS_TOKEN;
    if (!accessToken || !secretAccessToken) {
      throw new Error(
        'GESTAOCLICK_ACCESS_TOKEN e GESTAOCLICK_SECRET_ACCESS_TOKEN são obrigatórios quando ERP_ADAPTER=gestaoclick.',
      );
    }
    this.accessToken = accessToken;
    this.secretAccessToken = secretAccessToken;
  }

  supportsDateWindowFilter(resource: ErpResourceName): boolean {
    return DATE_WINDOW_RESOURCES.includes(resource);
  }

  async healthCheck() {
    try {
      await this.listResource('clientes', { page: 1, pageSize: 1 });
      return { ok: true };
    } catch (error) {
      return { ok: false, details: (error as Error).message };
    }
  }

  async listResource(resource: ErpResourceName, params: ErpListParams): Promise<ErpListResult> {
    // Descoberta real: a ação de listagem de notas_fiscais é privada nesta
    // API ("Private Action NotasFiscaisController::index() is not directly
    // accessible", HTTP 404) — falha rápido em vez de gastar uma chamada
    // por sincronização para redescobrir o mesmo 404 sempre.
    if (resource === 'notas_fiscais') {
      throw new GestaoClickError(
        'Gestão Click (notas_fiscais): a listagem deste recurso não é acessível via API nesta conta (ação privada no ERP).',
        404,
        false,
      );
    }

    const query = new URLSearchParams();
    query.set('pagina', String(params.page));
    if (this.supportsDateWindowFilter(resource)) {
      if (params.dateFrom) query.set('data_inicio', params.dateFrom);
      if (params.dateTo) query.set('data_fim', params.dateTo);
    }

    const url = `${BASE_URL}/${resource}?${query.toString()}`;
    const res = await fetch(url, {
      headers: {
        'access-token': this.accessToken,
        'secret-access-token': this.secretAccessToken,
        'Content-Type': 'application/json',
      },
    });

    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const mensagem = payload?.data?.mensagem ?? payload?.mensagem ?? res.statusText;
      // 401/403 = credenciais erradas, não vale a pena tentar de novo. O
      // resto (429/5xx/timeout) é transitório e pode ser retentado.
      const retryable = res.status !== 401 && res.status !== 403 && res.status !== 404;
      throw new GestaoClickError(`Gestão Click (${resource}): ${mensagem}`, res.status, retryable);
    }

    const meta = payload?.meta;
    const erpListMeta: ErpListMeta = meta
      ? {
          totalRecords: meta.total_registros,
          totalPages: meta.total_paginas,
          currentPage: meta.pagina_atual,
          pageSize: meta.limite_por_pagina,
        }
      : { totalRecords: payload?.data?.length ?? 0, totalPages: 1, currentPage: 1, pageSize: params.pageSize ?? 100 };

    return { data: payload?.data ?? [], meta: erpListMeta };
  }
}
