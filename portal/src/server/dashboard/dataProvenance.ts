import { prisma } from '@/server/db/prisma';

/**
 * Se os dados vieram do MockErpAdapter ou do GestaoClickAdapter real — não
 * é um valor fixo (isso era um resquício de quando só existia o adaptador
 * mock). Deriva do SyncRun mais recente com sucesso; sem nenhuma
 * sincronização ainda, assume simulado por segurança (não afirma "dados
 * reais" sem ter certeza).
 */
export async function getIsDataSimulated(): Promise<boolean> {
  const ultimoSync = await prisma.syncRun.findFirst({
    where: { status: { in: ['SUCESSO', 'PARCIAL'] } },
    orderBy: { finishedAt: 'desc' },
    select: { isSimulated: true },
  });
  return ultimoSync?.isSimulated ?? true;
}
