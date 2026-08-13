import { auth } from '@/server/auth/auth';
import { ForbiddenError, UnauthorizedError } from '@/server/errors';
import { currentApiActor } from '@/server/integracoes/apiActorContext';
import { can } from '@/shared/constants/roles';
import type { Action, Resource, RoleName } from '@/shared/types/rbac.types';

export interface AuthzSession {
  /** Nulo quando a chamada veio de uma chave de API (não há usuário humano). */
  userId: string | null;
  role: RoleName;
  /** Preenchido só quando a origem é uma chave de API — ver apiActorContext. */
  apiKeyId?: string;
}

/**
 * Todo acesso a dado de negócio passa por aqui — é a linha que realmente
 * garante autorização no servidor (guardas de rota são só a camada rápida
 * de UX, ver src/server/auth/requireRole.ts).
 *
 * Duas origens possíveis, mesma matriz de permissão (`can`): sessão web ou
 * chave de API. A chave de API carrega um perfil idêntico ao de um usuário,
 * então uma chave FINANCEIRO enxerga exatamente o que um usuário FINANCEIRO
 * enxergaria — nada de superfície de acesso paralela.
 */
export function withAuthz<TArgs extends unknown[], TResult>(
  resource: Resource,
  action: Action,
  fn: (session: AuthzSession, ...args: TArgs) => Promise<TResult>,
) {
  return async (...args: TArgs): Promise<TResult> => {
    const apiActor = currentApiActor();
    if (apiActor) {
      if (!can(apiActor.role, action, resource)) throw new ForbiddenError(resource, action);
      return fn({ userId: null, role: apiActor.role, apiKeyId: apiActor.apiKeyId }, ...args);
    }

    const session = await auth();
    if (!session?.user?.active) throw new UnauthorizedError();
    if (!can(session.user.role, action, resource)) throw new ForbiddenError(resource, action);

    return fn({ userId: session.user.id, role: session.user.role }, ...args);
  };
}
