import { describe, expect, it } from 'vitest';
import { MockErpAdapter } from '@/server/erp/mockErpAdapter';

const adapter = new MockErpAdapter();

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

describe('MockErpAdapter — particularidades confirmadas contra a API real', () => {
  it('supportsDateWindowFilter é true só para pagamentos/recebimentos', () => {
    expect(adapter.supportsDateWindowFilter('pagamentos')).toBe(true);
    expect(adapter.supportsDateWindowFilter('recebimentos')).toBe(true);
    expect(adapter.supportsDateWindowFilter('clientes')).toBe(false);
    expect(adapter.supportsDateWindowFilter('notas_fiscais')).toBe(false);
  });

  it('sem dateFrom/dateTo, pagamentos só devolve uma janela recente estreita', async () => {
    const resultado = await adapter.listResource('pagamentos', { page: 1, pageSize: 1000, empresaSeed: 'teste-a' });
    const inicioJanela = toDateOnly(new Date(Date.now() - 7 * 86400000));
    const fimJanela = toDateOnly(new Date(Date.now() + 30 * 86400000));

    expect(resultado.data.length).toBeGreaterThan(0);
    for (const registro of resultado.data) {
      const vencimento = (registro as { data_vencimento: string }).data_vencimento;
      expect(vencimento >= inicioJanela && vencimento <= fimJanela).toBe(true);
    }
  });

  it('com dateFrom/dateTo, filtra por data_liquidacao quando liquidado e por data_vencimento quando aberto', async () => {
    const dateFrom = '2025-12-01';
    const dateTo = '2026-08-06';
    const resultado = await adapter.listResource('pagamentos', {
      page: 1,
      pageSize: 5000,
      empresaSeed: 'teste-b',
      dateFrom,
      dateTo,
    });

    expect(resultado.data.length).toBeGreaterThan(0);
    for (const registro of resultado.data as Array<{
      liquidado: string;
      data_liquidacao: string;
      data_vencimento: string;
    }>) {
      const referencia = registro.liquidado === '1' ? registro.data_liquidacao : registro.data_vencimento;
      expect(referencia >= dateFrom && referencia <= dateTo).toBe(true);
    }
  });

  it('é determinístico — a mesma empresaSeed produz o mesmo total de registros', async () => {
    const primeira = await adapter.listResource('clientes', { page: 1, empresaSeed: 'determinismo' });
    const segunda = await adapter.listResource('clientes', { page: 1, empresaSeed: 'determinismo' });
    expect(primeira.meta.totalRecords).toBe(segunda.meta.totalRecords);
    expect(primeira.data).toEqual(segunda.data);
  });

  it('pagina corretamente respeitando pageSize e meta.totalPages', async () => {
    const pagina1 = await adapter.listResource('fornecedores', { page: 1, pageSize: 5, empresaSeed: 'paginacao' });
    expect(pagina1.data.length).toBeLessThanOrEqual(5);
    expect(pagina1.meta.currentPage).toBe(1);
    expect(pagina1.meta.totalPages).toBeGreaterThanOrEqual(1);
  });
});
