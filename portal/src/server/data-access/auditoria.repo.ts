import { prisma } from '@/server/db/prisma';
import type { Pagination } from '@/shared/schemas/common.schema';
import { withAuthz } from './withAuthz';

export const listAuditLogs = withAuthz(
  'auditoria',
  'read',
  async (_session, empresaId: string | undefined, pagination: Pagination) => {
    const where = empresaId ? { empresaId } : {};
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { rows, total, page: pagination.page, pageSize: pagination.pageSize };
  },
);
