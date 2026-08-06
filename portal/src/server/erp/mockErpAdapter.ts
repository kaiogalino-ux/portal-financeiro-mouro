import type { ErpAdapter, ErpListMeta, ErpListParams, ErpListResult, ErpResourceName } from './types';

/**
 * Adaptador simulado — única fonte de dados usada nesta entrega (ver
 * .env.example: ERP_ADAPTER=mock). Gera um dataset determinístico por
 * "empresaSeed" (RNG com seed fixa, não Math.random puro) para que rodar a
 * sincronização/seed repetidas vezes produza sempre os mesmos números.
 *
 * Reproduz de propósito duas particularidades reais confirmadas contra a
 * API do Gestão Click nesta sessão (ver src/gestaoClickClient.js na raiz do
 * repo): (1) sem dateFrom/dateTo, pagamentos/recebimentos só devolvem uma
 * janela recente estreita; (2) com dateFrom/dateTo, o filtro usa
 * data_liquidacao para títulos já pagos e data_vencimento para os em
 * aberto. Isso existe para que o orquestrador seja testado contra o mesmo
 * comportamento que o adaptador real vai ter.
 */

function mulberry32(seed: number) {
  let state = seed | 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const NOMES_CLIENTES = [
  'Alfa Distribuidora', 'Beta Engenharia', 'Cristal Alimentos', 'Delta Logística',
  'Estrela Varejo', 'Fronteira Agro', 'Global Têxtil', 'Horizonte Construções',
  'Ipê Comércio', 'Jangada Transportes', 'Kairós Serviços', 'Litoral Pescados',
  'Metrópole Materiais', 'Norte Equipamentos', 'Oceânica Importadora', 'Planalto Mineração',
  'Quintal Orgânicos', 'Raiz Consultoria', 'Sertão Bebidas', 'Torre Tecnologia',
];

const NOMES_FORNECEDORES = [
  'Bradesco', 'Itaú Unibanco', 'Vivo Telecom', 'Claro Empresas', 'AWS Brasil',
  'Microsoft Brasil', 'Contabilidade Prisma', 'Escritório Reder e Rossi', 'Gráfica Central',
  'Distribuidora de Papel São Jorge', 'Manutenção Predial Fix', 'Segurança Vigia Total',
  'Combustíveis Posto Real', 'Material de Escritório Kalunga', 'Correios',
];

const CATEGORIAS_DESPESA = [
  'Impostos - taxas municipais e alvará', 'Impostos - ISS', 'Assessorias e associações',
  'Folha de pagamento', 'Aluguel e condomínio', 'Energia e água', 'Telefonia e internet',
  'Manutenção e limpeza',
];

const CATEGORIAS_RECEITA = ['Prestação de serviços', 'Venda de produtos', 'Recuperação de créditos', 'Outras receitas'];

const CENTROS_CUSTO = ['Matriz - Administrativo', 'IND. - Comercial', 'IND. - Jurídico', 'OPER - Filial Norte', 'OPER - Filial Sul'];

const FORMAS_PAGAMENTO = ['Boleto Bancário', 'PIX', 'Cartão de Crédito', 'Transferência Bancária'];

const CONTAS_BANCARIAS = ['Bradesco', 'Itaú', 'Banco do Brasil'];

interface EmpresaDataset {
  clientes: Record<string, unknown>[];
  fornecedores: Record<string, unknown>[];
  transportadoras: Record<string, unknown>[];
  formasPagamento: Record<string, unknown>[];
  contasBancarias: Record<string, unknown>[];
  pagamentos: Record<string, unknown>[];
  recebimentos: Record<string, unknown>[];
  notasFiscais: Record<string, unknown>[];
  generico: Record<ErpResourceName, Record<string, unknown>[]>;
}

const datasetCache = new Map<string, EmpresaDataset>();

function pick<T>(random: () => number, list: T[]): T {
  return list[Math.floor(random() * list.length)]!;
}

function buildDataset(empresaSeed: string): EmpresaDataset {
  const random = mulberry32(hashStringToInt(empresaSeed));
  const hoje = new Date();

  const clientes = NOMES_CLIENTES.map((nome, i) => ({
    id: String(100000 + i),
    tipo_pessoa: 'PJ',
    nome,
    razao_social: nome,
    cnpj: `${String(10000000 + i).padStart(8, '0')}0001${String(10 + i)}`,
    email: `contato@${nome.toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
    telefone: `1${String(30000000 + i * 111).padStart(9, '0')}`,
    cadastrado_em: toDateOnly(addDays(hoje, -400 + i * 5)),
  }));

  const fornecedores = NOMES_FORNECEDORES.map((nome, i) => ({
    id: String(200000 + i),
    tipo_pessoa: 'PJ',
    nome,
    razao_social: nome,
    cnpj: `${String(20000000 + i).padStart(8, '0')}0001${String(20 + i)}`,
    email: `financeiro@${nome.toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
    cadastrado_em: toDateOnly(addDays(hoje, -400 + i * 7)),
  }));

  const transportadoras = ['Rápido Norte', 'ExpressoLog', 'CargaCerta'].map((nome, i) => ({
    id: String(300000 + i),
    nome,
  }));

  const formasPagamento = FORMAS_PAGAMENTO.map((nome, i) => ({ id: String(2600000 + i), nome }));
  const contasBancarias = CONTAS_BANCARIAS.map((nome, i) => ({ id: String(340000 + i), nome }));

  function gerarTitulos(tipo: 'pagar' | 'receber', quantidade: number): Record<string, unknown>[] {
    const registros: Record<string, unknown>[] = [];
    for (let i = 0; i < quantidade; i++) {
      const diasOffset = Math.floor(random() * 450) - 380; // ~12 meses atrás até ~2 meses no futuro
      const dataVencimento = addDays(hoje, diasOffset);
      const liquidado = diasOffset < -3 ? random() > 0.03 : diasOffset < 0 ? random() > 0.35 : false;
      const dataLiquidacao = liquidado ? addDays(dataVencimento, Math.floor(random() * 5)) : null;
      const valor = Math.round((200 + random() * 48000) * 100) / 100;
      const isPagar = tipo === 'pagar';
      const categoria = isPagar ? pick(random, CATEGORIAS_DESPESA) : pick(random, CATEGORIAS_RECEITA);
      const centroCusto = pick(random, CENTROS_CUSTO);
      const formaPagamento = pick(random, formasPagamento) as { id: string; nome: string };
      const contaBancaria = pick(random, contasBancarias) as { id: string; nome: string };
      const contraparte = isPagar
        ? (pick(random, fornecedores) as { id: string; nome: string })
        : (pick(random, clientes) as { id: string; nome: string });

      registros.push({
        id: String((isPagar ? 500000 : 600000) + i),
        codigo: String(9000 + i),
        descricao: `${categoria} - ${dataVencimento.getMonth() + 1}/${dataVencimento.getFullYear()}`,
        valor: valor.toFixed(2),
        juros: '0.00',
        desconto: '0.00',
        taxa_banco: '0.00',
        taxa_operadora: '0.00',
        valor_total: valor.toFixed(2),
        plano_contas_id: String(hashStringToInt(categoria) >>> 0),
        nome_plano_conta: categoria,
        centro_custo_id: String(hashStringToInt(centroCusto) >>> 0),
        nome_centro_custo: centroCusto,
        conta_bancaria_id: contaBancaria.id,
        nome_conta_bancaria: contaBancaria.nome,
        forma_pagamento_id: formaPagamento.id,
        nome_forma_pagamento: formaPagamento.nome,
        entidade: isPagar ? 'F' : 'C',
        fornecedor_id: isPagar ? contraparte.id : '',
        nome_fornecedor: isPagar ? contraparte.nome : '',
        cliente_id: isPagar ? '' : contraparte.id,
        nome_cliente: isPagar ? '' : contraparte.nome,
        transportadora_id: '',
        nome_transportadora: '',
        funcionario_id: '',
        nome_funcionario: '',
        liquidado: liquidado ? '1' : '0',
        data_vencimento: toDateOnly(dataVencimento),
        data_liquidacao: dataLiquidacao ? toDateOnly(dataLiquidacao) : '',
        data_competencia: toDateOnly(dataVencimento),
        usuario_id: '1',
        nome_usuario: 'FINANCEIRO',
        loja_id: '1',
        nome_loja: 'Matriz',
        cadastrado_em: `${toDateOnly(addDays(dataVencimento, -30))} 09:00:00`,
        modificado_em: `${toDateOnly(dataLiquidacao ?? dataVencimento)} 10:00:00`,
        atributos: [],
      });
    }
    return registros;
  }

  const notasFiscais = Array.from({ length: 260 }, (_, i) => {
    const diasOffset = Math.floor(random() * 400) - 380;
    const dataEmissao = addDays(hoje, diasOffset);
    const cliente = pick(random, clientes) as { id: string; nome: string };
    const valor = Math.round((300 + random() * 15000) * 100) / 100;
    return {
      id: String(700000 + i),
      numero: String(1000 + i),
      serie: '1',
      situacao: 'autorizada',
      valor: valor.toFixed(2),
      cliente_id: cliente.id,
      nome_cliente: cliente.nome,
      data_emissao: toDateOnly(dataEmissao),
    };
  });

  const generico = {} as Record<ErpResourceName, Record<string, unknown>[]>;
  for (const resource of ['produtos', 'vendas', 'servicos', 'orcamentos', 'compras', 'usuarios'] as ErpResourceName[]) {
    generico[resource] = Array.from({ length: 20 }, (_, i) => ({
      id: String(800000 + hashStringToInt(resource + empresaSeed) + i),
      nome: `${resource}-simulado-${i + 1}`,
    }));
  }

  return {
    clientes,
    fornecedores,
    transportadoras,
    formasPagamento,
    contasBancarias,
    pagamentos: gerarTitulos('pagar', 420),
    recebimentos: gerarTitulos('receber', 360),
    notasFiscais,
    generico,
  };
}

function getDataset(empresaSeed: string): EmpresaDataset {
  const cached = datasetCache.get(empresaSeed);
  if (cached) return cached;
  const dataset = buildDataset(empresaSeed);
  datasetCache.set(empresaSeed, dataset);
  return dataset;
}

const DATE_WINDOW_RESOURCES: ErpResourceName[] = ['pagamentos', 'recebimentos'];

function resourceRecords(dataset: EmpresaDataset, resource: ErpResourceName): Record<string, unknown>[] {
  switch (resource) {
    case 'clientes':
      return dataset.clientes;
    case 'fornecedores':
      return dataset.fornecedores;
    case 'transportadoras':
      return dataset.transportadoras;
    case 'formas_pagamentos':
      return dataset.formasPagamento;
    case 'contas_bancarias':
      return dataset.contasBancarias;
    case 'pagamentos':
      return dataset.pagamentos;
    case 'recebimentos':
      return dataset.recebimentos;
    case 'notas_fiscais':
      return dataset.notasFiscais;
    default:
      return dataset.generico[resource] ?? [];
  }
}

function filterByDateWindow(
  resource: ErpResourceName,
  records: Record<string, unknown>[],
  params: ErpListParams,
): Record<string, unknown>[] {
  if (!DATE_WINDOW_RESOURCES.includes(resource)) return records;

  if (!params.dateFrom && !params.dateTo) {
    const inicioJanela = toDateOnly(addDays(new Date(), -7));
    const fimJanela = toDateOnly(addDays(new Date(), 30));
    return records.filter((registro) => {
      const vencimento = registro.data_vencimento as string;
      return vencimento >= inicioJanela && vencimento <= fimJanela;
    });
  }

  const de = params.dateFrom ?? '0000-01-01';
  const ate = params.dateTo ?? '9999-12-31';
  return records.filter((registro) => {
    const liquidado = registro.liquidado === '1';
    const referencia = liquidado ? (registro.data_liquidacao as string) : (registro.data_vencimento as string);
    if (!referencia) return false;
    return referencia >= de && referencia <= ate;
  });
}

export class MockErpAdapter implements ErpAdapter {
  readonly name = 'mock';
  readonly isSimulated = true;

  supportsDateWindowFilter(resource: ErpResourceName): boolean {
    return DATE_WINDOW_RESOURCES.includes(resource);
  }

  async healthCheck() {
    return { ok: true, details: 'MockErpAdapter — dados simulados, sem chamada externa.' };
  }

  async listResource(resource: ErpResourceName, params: ErpListParams): Promise<ErpListResult> {
    const failureRate = Number(process.env.MOCK_ERP_FAILURE_RATE ?? '0');
    if (failureRate > 0 && Math.random() < failureRate) {
      const error = new Error(`Falha simulada ao buscar "${resource}" (MOCK_ERP_FAILURE_RATE)`);
      (error as Error & { retryable?: boolean }).retryable = true;
      throw error;
    }

    const dataset = getDataset(params.empresaSeed ?? 'default');
    const todos = filterByDateWindow(resource, resourceRecords(dataset, resource), params);

    const pageSize = params.pageSize ?? 100;
    const totalRecords = todos.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const currentPage = Math.min(params.page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
      data: todos.slice(start, start + pageSize),
      meta: { totalRecords, totalPages, currentPage, pageSize } satisfies ErpListMeta,
    };
  }
}
