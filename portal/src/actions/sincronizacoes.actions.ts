'use server';

import { requireRole } from '@/server/auth/requireRole';
import { runSync } from '@/server/sync/orchestrator';
import { logAction } from '@/server/audit/logAction';

export async function triggerManualSync(empresaId: string) {
  const session = await requireRole(['ADMINISTRADOR', 'FINANCEIRO']);

  const result = await runSync(empresaId, {
    trigger: 'MANUAL',
    triggeredByUserId: session.user.id,
  });

  await logAction({
    empresaId,
    actorType: 'USUARIO',
    userId: session.user.id,
    action: 'SINCRONIZACAO_MANUAL',
    entityType: 'SyncRun',
    entityId: result.syncRunId,
    afterData: result,
  });

  return result;
}
