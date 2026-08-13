import { AsyncLocalStorage } from 'node:async_hooks';
import type { RoleName } from '@/shared/types/rbac.types';

export interface ApiActor {
  apiKeyId: string;
  nome: string;
  role: RoleName;
}

/**
 * Quem está chamando quando a origem é uma chave de API, e não uma sessão
 * web. Existe para que `withAuthz` — a única linha que de fato garante
 * autorização no servidor — continue sendo o único ponto de checagem, sem
 * precisar duplicar em rotas de API as mesmas queries já escritas nos
 * repositórios. As rotas /api/v1 envolvem o handler em `runAsApiActor`, e
 * daí para baixo todo repositório existente funciona sem alteração.
 */
const storage = new AsyncLocalStorage<ApiActor>();

export function runAsApiActor<T>(actor: ApiActor, fn: () => Promise<T>): Promise<T> {
  return storage.run(actor, fn);
}

export function currentApiActor(): ApiActor | undefined {
  return storage.getStore();
}
