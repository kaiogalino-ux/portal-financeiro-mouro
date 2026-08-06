import { prisma } from '@/server/db/prisma';
import type { AuditActorType } from '@/generated/prisma';

interface LogActionInput {
  empresaId: string;
  actorType: AuditActorType;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
}

/**
 * Registro de mudança de negócio (distinto do histórico mecânico de
 * sincronização em SyncRun/SyncLogEntry — ver plano). Chamado a partir de
 * withAuthz para toda operação de escrita relevante.
 */
export async function logAction(input: LogActionInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      empresaId: input.empresaId,
      actorType: input.actorType,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeData: input.beforeData === undefined ? undefined : (input.beforeData as never),
      afterData: input.afterData === undefined ? undefined : (input.afterData as never),
    },
  });
}
