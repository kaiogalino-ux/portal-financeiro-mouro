import { beforeEach, describe, expect, it, vi } from 'vitest';

interface CondicaoPorEstado {
  liquidado: boolean;
  dataVencimento?: { gte: Date; lte: Date };
  dataLiquidacao?: { gte: Date; lte: Date };
}

interface WhereReconciliacao {
  empresaId?: string;
  tipo?: string;
  liquidado?: boolean;
  canceladoEm?: Date | null;
  dataVencimento?: { gte: Date; lte: Date };
  erpId?: { notIn: string[] };
  OR?: CondicaoPorEstado[];
}

interface UpdateManyArgs {
  where: WhereReconciliacao;
  data: { canceladoEm: Date };
}

const updateMany = vi.fn(async (_args: UpdateManyArgs) => ({ count: 0 }));

vi.mock('@/server/db/prisma', () => ({
  prisma: { titulo: { updateMany } },
}));

const { reconciliarTitulosRemovidos } = await import('@/server/sync/orchestrator');

const JANELA = { dateFrom: '2026-01-01', dateTo: '2026-07-31' };

function ultimaChamada(): UpdateManyArgs {
  const chamada = updateMany.mock.calls.at(-1);
  if (!chamada) throw new Error('updateMany não foi chamado');
  return chamada[0];
}

/** O `where` que a última chamada a updateMany recebeu. */
function ultimoWhere(): WhereReconciliacao {
  return ultimaChamada().where;
}

/** As condições por estado (em aberto / liquidado) desse where. */
function condicoes(): CondicaoPorEstado[] {
  const or = ultimoWhere().OR;
  if (!or) throw new Error('where sem OR — a reconciliação voltou a olhar um estado só');
  return or;
}

beforeEach(() => {
  updateMany.mockClear();
});

describe('reconciliarTitulosRemovidos', () => {
  it('não cancela nada quando a janela não tem início e fim', async () => {
    expect(await reconciliarTitulosRemovidos('e1', 'RECEBER', {}, new Set(['1']))).toBe(0);
    expect(await reconciliarTitulosRemovidos('e1', 'RECEBER', { dateFrom: '2026-01-01' }, new Set(['1']))).toBe(0);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('alcança títulos liquidados, não só os em aberto', async () => {
    // Regressão: a rotina nasceu com `liquidado: false` fixo no where, então
    // uma NF já baixada e apagada no ERP (PRIO, R$ 35.755,67) continuava
    // somando pra sempre em "Recebido até hoje".
    await reconciliarTitulosRemovidos('e1', 'RECEBER', JANELA, new Set(['1']));

    expect(ultimoWhere().liquidado).toBeUndefined();
    expect(condicoes().filter((c) => c.liquidado)).toHaveLength(1);
  });

  it('compara a janela contra o campo que a API do Gestão Click usa em cada estado', async () => {
    // Em aberto entra na resposta pela data de vencimento; liquidado, pela
    // data de liquidação. Comparar tudo por vencimento cancelaria um título
    // liquidado cuja baixa (e portanto sua presença na resposta) cai fora.
    await reconciliarTitulosRemovidos('e1', 'PAGAR', JANELA, new Set(['1']));

    const emAberto = condicoes().find((c) => !c.liquidado)!;
    const liquidado = condicoes().find((c) => c.liquidado)!;

    expect(emAberto.dataVencimento).toBeDefined();
    expect(emAberto.dataLiquidacao).toBeUndefined();
    expect(liquidado.dataLiquidacao).toBeDefined();
    expect(liquidado.dataVencimento).toBeUndefined();

    expect(emAberto.dataVencimento!.gte).toEqual(new Date('2026-01-01T00:00:00'));
    expect(liquidado.dataLiquidacao!.lte).toEqual(new Date('2026-07-31T23:59:59'));
  });

  it('restringe a empresa e tipo pedidos e ignora o que já está cancelado', async () => {
    await reconciliarTitulosRemovidos('empresa-x', 'RECEBER', JANELA, new Set(['1']));

    const where = ultimoWhere();
    expect(where.empresaId).toBe('empresa-x');
    expect(where.tipo).toBe('RECEBER');
    // Sem isso, cada sincronização reescreveria a data de cancelamento de
    // títulos já cancelados antes.
    expect(where.canceladoEm).toBeNull();
  });

  it('poupa exatamente os erpIds que vieram na resposta', async () => {
    await reconciliarTitulosRemovidos('e1', 'RECEBER', JANELA, new Set(['10', '20', '30']));

    expect(ultimoWhere().erpId!.notIn.sort()).toEqual(['10', '20', '30']);
  });

  it('marca com data de cancelamento em vez de apagar, preservando auditoria', async () => {
    await reconciliarTitulosRemovidos('e1', 'RECEBER', JANELA, new Set(['1']));

    expect(ultimaChamada().data.canceladoEm).toBeInstanceOf(Date);
  });

  it('devolve quantos títulos foram cancelados', async () => {
    updateMany.mockResolvedValueOnce({ count: 7 });
    expect(await reconciliarTitulosRemovidos('e1', 'RECEBER', JANELA, new Set(['1']))).toBe(7);
  });
});
