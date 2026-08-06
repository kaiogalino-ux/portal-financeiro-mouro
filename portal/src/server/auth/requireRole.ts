import { auth } from '@/server/auth/auth';
import { UnauthorizedError, ForbiddenError } from '@/server/errors';
import type { RoleName } from '@/shared/types/rbac.types';

/**
 * Guarda de rota (camada 2 de defesa) — falha rápido antes de tocar no
 * banco. A autorização que realmente importa é `withAuthz` na camada de
 * acesso a dados; isto aqui é só para devolver 401/403 mais cedo/barato.
 */
export async function requireRole(allowed: RoleName[]) {
  const session = await auth();
  if (!session?.user?.active) throw new UnauthorizedError();
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError(allowed.join('|'), 'read');
  }
  return session;
}
