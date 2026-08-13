import { PrismaClient } from '@/generated/prisma';
import { runSync } from '@/server/sync/orchestrator';

/**
 * Sincronização agendada (trigger AGENDADO) — pensada para rodar via
 * Windows Task Scheduler, uma vez por dia: `npx tsx scripts/sync-diario.ts`.
 * Roda para todas as empresas ativas; loga o resultado de cada uma no
 * SyncRun normal (aparece em Sincronizações no portal, igual ao manual).
 */

const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany({
    where: { ativo: true },
    select: { id: true, razaoSocial: true, nomeFantasia: true },
  });

  if (empresas.length === 0) {
    console.log('Nenhuma empresa ativa encontrada — nada para sincronizar.');
    return;
  }

  let houveFalha = false;

  for (const empresa of empresas) {
    const nome = empresa.nomeFantasia ?? empresa.razaoSocial;
    console.log(`[${new Date().toISOString()}] Sincronizando ${nome} (${empresa.id})...`);
    try {
      const resultado = await runSync(empresa.id, { trigger: 'AGENDADO' });
      console.log(
        `  status=${resultado.status} buscados=${resultado.totalFetched} ` +
          `criados=${resultado.totalCreated} atualizados=${resultado.totalUpdated} falhas=${resultado.totalFailed}`,
      );
      if (resultado.status === 'FALHOU') houveFalha = true;
    } catch (error) {
      houveFalha = true;
      console.error(`  erro ao sincronizar ${nome} (${empresa.id}):`, error);
    }
  }

  if (houveFalha) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
