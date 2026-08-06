import { PrismaClient } from '@/generated/prisma';
import { hashPassword } from '@/server/auth/password';
import { runSync } from '@/server/sync/orchestrator';

/**
 * Bootstrap para uso com ERP_ADAPTER=gestaoclick (dados reais), em vez do
 * prisma/seed.ts (que cria empresas fictícias e roda o MockErpAdapter).
 * Roda com: npx tsx scripts/bootstrap-real.ts
 */

const prisma = new PrismaClient();
const SENHA_PADRAO_DEMO = 'Mouro@2026';

async function main() {
  if (process.env.ERP_ADAPTER !== 'gestaoclick') {
    throw new Error('Defina ERP_ADAPTER=gestaoclick no .env antes de rodar este script.');
  }

  // CNPJ placeholder — a API do Gestão Click não expõe um endpoint de dados
  // cadastrais da própria empresa entre os recursos confirmados, então este
  // valor é só uma âncora local. Ajuste depois via Prisma Studio se quiser.
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00000000000191' },
    create: { cnpj: '00000000000191', razaoSocial: 'Mouro Soluções', nomeFantasia: 'Mouro Soluções (ajustar CNPJ)' },
    update: {},
  });

  const passwordHash = await hashPassword(SENHA_PADRAO_DEMO);
  await prisma.user.upsert({
    where: { email: 'Financeiro@mourosolucoes.com.br' },
    create: { name: 'Financeiro', email: 'Financeiro@mourosolucoes.com.br', passwordHash, role: 'ADMINISTRADOR' },
    update: {},
  });

  console.log(`Empresa: ${empresa.nomeFantasia} (${empresa.id})`);
  console.log('Disparando sincronização com a API real do Gestão Click...');

  const resultado = await runSync(empresa.id, { trigger: 'MANUAL' });

  console.log(
    `status=${resultado.status} buscados=${resultado.totalFetched} criados=${resultado.totalCreated} atualizados=${resultado.totalUpdated} falhas=${resultado.totalFailed}`,
  );
  console.log('\nLogin: Financeiro@mourosolucoes.com.br');
  console.log(`Senha: ${SENHA_PADRAO_DEMO}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
