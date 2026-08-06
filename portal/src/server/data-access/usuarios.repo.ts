import { prisma } from '@/server/db/prisma';
import { hashPassword } from '@/server/auth/password';
import { logAction } from '@/server/audit/logAction';
import type { Pagination } from '@/shared/schemas/common.schema';
import type { RoleName } from '@/shared/types/rbac.types';
import { withAuthz } from './withAuthz';

export const listUsuarios = withAuthz('usuarios', 'read', async (_session, pagination: Pagination) => {
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: 'asc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    }),
    prisma.user.count(),
  ]);
  return { rows, total, page: pagination.page, pageSize: pagination.pageSize };
});

interface CreateUsuarioInput {
  name: string;
  email: string;
  password: string;
  role: RoleName;
}

export const createUsuario = withAuthz(
  'usuarios',
  'create',
  async (session, empresaId: string, input: CreateUsuarioInput) => {
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await logAction({
      empresaId,
      actorType: 'USUARIO',
      userId: session.userId,
      action: 'USUARIO_CRIAR',
      entityType: 'User',
      entityId: user.id,
      afterData: user,
    });

    return user;
  },
);

interface UpdateUsuarioInput {
  role?: RoleName;
  active?: boolean;
}

export const updateUsuario = withAuthz(
  'usuarios',
  'update',
  async (session, empresaId: string, userId: string, input: UpdateUsuarioInput) => {
    const before = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, active: true },
    });

    const user = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    await logAction({
      empresaId,
      actorType: 'USUARIO',
      userId: session.userId,
      action: 'USUARIO_ATUALIZAR',
      entityType: 'User',
      entityId: user.id,
      beforeData: before,
      afterData: user,
    });

    return user;
  },
);
