// Contrato desacoplado do ERP — hoje só existe MockErpAdapter (dados
// simulados). Um GestaoClickAdapter real, quando a documentação oficial for
// fornecida, implementa esta mesma interface sem exigir mudança no
// orquestrador (src/server/sync/orchestrator.ts).

/** Recursos confirmados contra a API real do Gestão Click nesta sessão
 * (ver src/gestaoClickClient.js na raiz do repo) — mantidos aqui só como
 * referência de nomenclatura para o adaptador mock, não como uma promessa
 * de que o adaptador real já existe. */
export type ErpResourceName =
  | 'clientes'
  | 'produtos'
  | 'vendas'
  | 'recebimentos'
  | 'pagamentos'
  | 'fornecedores'
  | 'servicos'
  | 'orcamentos'
  | 'transportadoras'
  | 'notas_fiscais'
  | 'compras'
  | 'contas_bancarias'
  | 'formas_pagamentos'
  | 'usuarios';

export interface ErpListParams {
  page: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  /** Usado só pelo MockErpAdapter para gerar um dataset distinto por
   * empresa simulada; um adaptador real usaria credenciais por empresa. */
  empresaSeed?: string;
}

export interface ErpListMeta {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ErpListResult<TRaw = Record<string, unknown>> {
  data: TRaw[];
  meta: ErpListMeta;
}

export interface ErpAdapter {
  readonly name: string;
  readonly isSimulated: boolean;
  listResource(resource: ErpResourceName, params: ErpListParams): Promise<ErpListResult>;
  /** Recursos onde dateFrom/dateTo têm efeito — confirmado empiricamente
   * apenas para pagamentos/recebimentos contra a API real. */
  supportsDateWindowFilter(resource: ErpResourceName): boolean;
  healthCheck(): Promise<{ ok: boolean; details?: string }>;
}

export const ERP_RESOURCES: ErpResourceName[] = [
  'clientes',
  'produtos',
  'vendas',
  'recebimentos',
  'pagamentos',
  'fornecedores',
  'servicos',
  'orcamentos',
  'transportadoras',
  'notas_fiscais',
  'compras',
  'contas_bancarias',
  'formas_pagamentos',
  'usuarios',
];
