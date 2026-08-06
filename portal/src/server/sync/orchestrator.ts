import { prisma } from '@/server/db/prisma';
import { MockErpAdapter } from '@/server/erp/mockErpAdapter';
import { GestaoClickAdapter } from '@/server/erp/gestaoClickAdapter';
import type { ErpAdapter, ErpResourceName } from '@/server/erp/types';
import { mapAndUpsert, MAPPED_RESOURCES } from '@/server/erp/mappings/registry';
import { unwrapErpRecord } from '@/server/erp/unwrapErpRecord';
import type { SyncRunStatus, SyncTrigger } from '@/generated/prisma';

/** Ordem importa: dados-mestre antes de títulos (que referenciam suas FKs
 * locais), notas depois, recursos sem mapeamento por último. */
const RESOURCE_ORDER: ErpResourceName[] = [
  'clientes',
  'fornecedores',
  'transportadoras',
  'formas_pagamentos',
  'contas_bancarias',
  'pagamentos',
  'recebimentos',
  'notas_fiscais',
  'produtos',
  'vendas',
  'servicos',
  'orcamentos',
  'compras',
  'usuarios',
];

function getAdapter(): ErpAdapter {
  const adapterName = process.env.ERP_ADAPTER ?? 'mock';
  if (adapterName === 'gestaoclick') return new GestaoClickAdapter();
  if (adapterName === 'mock') return new MockErpAdapter();
  throw new Error(`Adaptador "${adapterName}" desconhecido — use "mock" ou "gestaoclick".`);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = (error as { retryable?: boolean })?.retryable ?? true;
      if (!retryable || attempt === maxAttempts) break;
      const backoffMs = Math.min(30_000, 1000 * 2 ** (attempt - 1)) + Math.random() * 250;
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

export interface RunSyncOptions {
  trigger: SyncTrigger;
  triggeredByUserId?: string | null;
  resources?: ErpResourceName[];
  dateFrom?: string;
  dateTo?: string;
}

export interface RunSyncResult {
  syncRunId: string;
  status: SyncRunStatus;
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
}

function defaultDateWindow(): { dateFrom: string; dateTo: string } {
  const lookbackDays = Number(process.env.SYNC_LOOKBACK_DAYS ?? '270');
  const lookaheadDays = Number(process.env.SYNC_LOOKAHEAD_DAYS ?? '60');
  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - lookbackDays);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + lookaheadDays);
  return { dateFrom: inicio.toISOString().slice(0, 10), dateTo: fim.toISOString().slice(0, 10) };
}

/**
 * Núcleo da sincronização — não passa por withAuthz de propósito, para
 * poder ser chamado tanto pela action autorizada da página
 * "Sincronizações" quanto pelo prisma/seed.ts (sem sessão HTTP). A
 * autorização de quem PODE disparar isso é responsabilidade do chamador.
 */
export async function runSync(empresaId: string, options: RunSyncOptions): Promise<RunSyncResult> {
  const empresa = await prisma.empresa.findUniqueOrThrow({ where: { id: empresaId } });
  const adapter = getAdapter();
  const resources = options.resources ?? RESOURCE_ORDER;
  const janela = adapter.isSimulated ? { dateFrom: options.dateFrom, dateTo: options.dateTo } : defaultDateWindow();

  const syncRun = await prisma.syncRun.create({
    data: {
      empresaId,
      trigger: options.trigger,
      triggeredByUserId: options.triggeredByUserId ?? null,
      status: 'EM_EXECUCAO',
      resourcesRequested: resources,
      erpAdapterName: adapter.name,
      isSimulated: adapter.isSimulated,
      startedAt: new Date(),
    },
  });

  let totalFetched = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let algumaFalhaFatal = false;

  for (const resource of resources) {
    const suportaJanela = adapter.supportsDateWindowFilter(resource);
    const resourceRun = await prisma.syncRunResource.create({
      data: {
        syncRunId: syncRun.id,
        resource,
        status: 'EM_EXECUCAO',
        dataInicioFiltro: suportaJanela && janela.dateFrom ? new Date(`${janela.dateFrom}T00:00:00`) : null,
        dataFimFiltro: suportaJanela && janela.dateTo ? new Date(`${janela.dateTo}T00:00:00`) : null,
        startedAt: new Date(),
      },
    });

    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;
    let falhas = 0;
    let page = 1;
    let totalPaginas = 1;

    try {
      do {
        const resultado = await withRetry(() =>
          adapter.listResource(resource, {
            page,
            empresaSeed: empresa.cnpj,
            ...(suportaJanela ? { dateFrom: janela.dateFrom, dateTo: janela.dateTo } : {}),
          }),
        );
        totalPaginas = resultado.meta.totalPages;
        totalFetched += resultado.data.length;

        for (const rawOriginal of resultado.data) {
          const raw = unwrapErpRecord(rawOriginal);
          try {
            if (MAPPED_RESOURCES.includes(resource)) {
              const outcome = await mapAndUpsert(resource, raw, { empresaId, syncRunId: syncRun.id });
              if (outcome.created) criados++;
              else atualizados++;
            } else {
              const erpId = String((raw as Record<string, unknown>).id ?? '');
              if (!erpId) throw new Error('Registro sem id — não é possível gravar em ErpRawRecord.');
              await prisma.erpRawRecord.upsert({
                where: { empresaId_resource_erpId: { empresaId, resource, erpId } },
                create: { empresaId, resource, erpId, payload: raw as never, syncRunId: syncRun.id },
                update: { payload: raw as never, syncRunId: syncRun.id },
              });
              ignorados++;
            }
          } catch (recordError) {
            falhas++;
            await prisma.syncLogEntry.create({
              data: {
                syncRunId: syncRun.id,
                syncRunResource: resource,
                level: 'ERROR',
                message: `Falha ao processar registro de "${resource}": ${(recordError as Error).message}`,
                context: { raw } as never,
              },
            });
          }
        }

        await prisma.syncRunResource.update({
          where: { id: resourceRun.id },
          data: { ultimaPaginaProcessada: page, paginasTotais: totalPaginas, registrosTotal: resultado.meta.totalRecords },
        });

        page++;
      } while (page <= totalPaginas);

      await prisma.syncRunResource.update({
        where: { id: resourceRun.id },
        data: {
          status: falhas > 0 ? 'PARCIAL' : 'SUCESSO',
          criados,
          atualizados,
          ignorados,
          falhas,
          finishedAt: new Date(),
        },
      });
    } catch (fatalError) {
      algumaFalhaFatal = true;
      await prisma.syncRunResource.update({
        where: { id: resourceRun.id },
        data: { status: 'FALHOU', criados, atualizados, ignorados, falhas, finishedAt: new Date() },
      });
      await prisma.syncLogEntry.create({
        data: {
          syncRunId: syncRun.id,
          syncRunResource: resource,
          level: 'ERROR',
          message: `Falha ao sincronizar "${resource}": ${(fatalError as Error).message}`,
        },
      });
    }

    totalCreated += criados;
    totalUpdated += atualizados;
    totalSkipped += ignorados;
    totalFailed += falhas;
  }

  const status: SyncRunStatus = algumaFalhaFatal
    ? totalCreated + totalUpdated > 0
      ? 'PARCIAL'
      : 'FALHOU'
    : totalFailed > 0
      ? 'PARCIAL'
      : 'SUCESSO';

  await prisma.syncRun.update({
    where: { id: syncRun.id },
    data: {
      status,
      finishedAt: new Date(),
      totalFetched,
      totalCreated,
      totalUpdated,
      totalSkipped,
      totalFailed,
    },
  });

  return { syncRunId: syncRun.id, status, totalFetched, totalCreated, totalUpdated, totalSkipped, totalFailed };
}
