import { auth } from '@/server/auth/auth';
import { ForbiddenError, UnauthorizedError } from '@/server/errors';
import { can } from '@/shared/constants/roles';
import type { Action, Resource } from '@/shared/types/rbac.types';

export interface AuthzSession {
  userId: string;
  role: import('@/shared/types/rbac.types').RoleName;
}

/**
 * Todo acesso a dado de negócio passa por aqui — é a linha que realmente
 * garante autorização no servidor (guardas de rota são só a camada rápida
 * de UX, ver src/server/auth/requireRole.ts).
 */
export function withAuthz<TArgs extends unknown[], TResult>(
  resource: Resource,
  action: Action,
  fn: (session: AuthzSession, ...args: TArgs) => Promise<TResult>,
) {
  return async (...args: TArgs): Promise<TResult> => {
    const session = await auth();
    if (!session?.user?.active) throw new UnauthorizedError();
    if (!can(session.user.role, action, resource)) throw new ForbiddenError(resource, action);

    return fn({ userId: session.user.id, role: session.user.role }, ...args);
  };
}
