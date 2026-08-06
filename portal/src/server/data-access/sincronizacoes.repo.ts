import { prisma } from '@/server/db/prisma';
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
