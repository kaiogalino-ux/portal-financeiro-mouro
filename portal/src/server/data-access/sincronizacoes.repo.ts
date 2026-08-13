import { prisma } from '@/server/db/prisma';
import { logAction } from '@/server/audit/logAction';
import { runSync } from '@/server/sync/orchestrator';
import type { Pagination } from '@/shared/schemas/common.schema';
import { withAuthz } from './withAuthz';

export const listSyncRuns = withAuthz(
  'sincronizacoes',
  'read',
  async (_session, empresaId: string | undefined, pagination: Pagination) => {
    const where = empresaId ? { empresaId } : {};
    const [rows, total] = await Promise.all([
      prisma.syncRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: {
          resourceRuns: true,
          triggeredByUser: { select: { name: true } },
        },
      }),
      prisma.syncRun.count({ where }),
    ]);
    return { rows, total, page: pagination.page, pageSize: pagination.pageSize };
  },
);

/**
 * Disparo de sincronização vindo da API pública. `runSync` de propósito não
 * passa por `withAuthz` (o seed também o chama, sem sessão HTTP) — então a
 * autorização precisa ser aplicada aqui, na borda, e não lá dentro.
 */
export const triggerSyncViaApi = withAuthz(
  'sincronizacoes',
  'create',
  async (session, empresaId: string) => {
    const resultado = await runSync(empresaId, { trigger: 'API', triggeredByUserId: session.userId });

    await logAction({
      empresaId,
      actorType: 'API',
      userId: session.userId,
      action: 'SINCRONIZACAO_VIA_API',
      entityType: 'SyncRun',
      entityId: resultado.syncRunId,
      afterData: { ...resultado, apiKeyId: session.apiKeyId ?? null },
    });

    return resultado;
  },
);

export const getSyncRunDetalhe = withAuthz('sincronizacoes', 'read', async (_session, syncRunId: string) => {
  return prisma.syncRun.findUniqueOrThrow({
    where: { id: syncRunId },
    include: {
      resourceRuns: true,
      logs: { orderBy: { createdAt: 'desc' }, take: 200 },
      triggeredByUser: { select: { name: true } },
    },
  });
});
