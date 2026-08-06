import path from 'node:path';
import { fileURLToPath } from 'node:url';
import xlsx from 'xlsx';
import { GestaoClickClient, RESOURCES } from '../src/gestaoClickClient.js';

// Uso: node scripts/relatorio-contas-a-pagar.js [data_inicio] [data_fim]
// Datas no formato AAAA-MM-DD. Padrão: 2025-12-01 até hoje.
const [dataInicioArg, dataFimArg] = process.argv.slice(2);
const dataInicio = dataInicioArg ?? '2025-12-01';
const dataFim = dataFimArg ?? new Date().toISOString().slice(0, 10);

const client = new GestaoClickClient();

// Sem data_inicio/data_fim, a API só devolve uma janela recente (ex: mês atual).
// Passando esses parâmetros ela filtra por data_liquidacao (contas pagas) ou
// data_vencimento (contas ainda abertas) dentro do intervalo — confirmado testando
// contra a API real.
async function listarTodosPagamentos() {
  const primeira = await client.list(RESOURCES.PAGAMENTOS, { pagina: 1, data_inicio: dataInicio, data_fim: dataFim });
  const registros = [...primeira.data];
  const totalPaginas = primeira.meta?.total_paginas ?? 1;

  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    const resposta = await client.list(RESOURCES.PAGAMENTOS, { pagina, data_inicio: dataInicio, data_fim: dataFim });
    registros.push(...resposta.data);
  }

  return registros;
}

function calcularDiasEmAtraso(dataVencimento, hoje) {
  const vencimento = new Date(dataVencimento);
  const diffMs = hoje - vencimento;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

const todos = await listarTodosPagamentos();
const hoje = new Date(`${dataFim}T00:00:00`);

const abertas = todos
  .filter((p) => p.liquidado === '0')
  .filter((p) => p.data_vencimento >= dataInicio && p.data_vencimento <= dataFim)
  .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento));

const linhas = abertas.map((p) => {
  const diasAtraso = calcularDiasEmAtraso(p.data_vencimento, hoje);
  return {
    Código: p.codigo,
    Descrição: p.descricao,
    Fornecedor: p.nome_fornecedor || (p.entidade === 'O' ? '(Outros)' : ''),
    'Plano de Contas': p.nome_plano_conta,
    'Centro de Custo': p.nome_centro_custo,
    'Data de Vencimento': p.data_vencimento,
    'Dias em Atraso': diasAtraso > 0 ? diasAtraso : 0,
    Situação: diasAtraso > 0 ? 'Vencido' : 'A vencer',
    Valor: Number(p.valor),
    Juros: Number(p.juros),
    Desconto: Number(p.desconto),
    'Valor Total': Number(p.valor_total),
    'Conta Bancária': p.nome_conta_bancaria,
    'Forma de Pagamento': p.nome_forma_pagamento,
    Loja: p.nome_loja,
  };
});

const valorTotal = linhas.reduce((soma, l) => soma + l['Valor Total'], 0);

const planilha = xlsx.utils.json_to_sheet(linhas);
planilha['!cols'] = [
  { wch: 10 }, { wch: 40 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
  { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
  { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 16 },
];

const livro = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(livro, planilha, 'Contas a Pagar');

const nomeArquivo = `contas-a-pagar_${dataInicio}_a_${dataFim}.xlsx`;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const caminhoSaida = path.join(projectRoot, 'relatorios', nomeArquivo);

xlsx.writeFile(livro, caminhoSaida);

console.log(`Período: ${dataInicio} a ${dataFim}`);
console.log(`Contas em aberto encontradas: ${linhas.length}`);
console.log(`Valor total em aberto: R$ ${valorTotal.toFixed(2)}`);
console.log(`Arquivo gerado: ${caminhoSaida}`);
