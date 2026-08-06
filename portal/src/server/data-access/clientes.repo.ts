import { prisma } from '@/server/db/prisma';
import { getIsDataSimulated } from '@/server/dashboard/dataProvenance';
import type { Pagination } from '@/shared/schemas/common.schema';
import { withAuthz } from './withAuthz';

export const listClientes = withAuthz(
  'clientes',
  'read',
  async (_session, empresaId: string | undefined, busca: string | undefined, pagination: Pagination) => {
    const where = {
      ...(empresaId ? { empresaId } : {}),
      ...(busca ? { nome: { contains: busca, mode: 'insensitive' as const } } : {}),
    };
    const [rows, total, isSimulated] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
      prisma.cliente.count({ where }),
      getIsDataSimulated(),
    ]);
    return { rows, total, page: pagination.page, pageSize: pagination.pageSize, isSimulated };
  },
);
