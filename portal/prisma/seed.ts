import { PrismaClient } from '@/generated/prisma';
import { hashPassword } from '@/server/auth/password';
import { runSync } from '@/server/sync/orchestrator';

const prisma = new PrismaClient();

/** Senha inicial dos usuários criados aqui — lida do `.env` (que nunca é
 * versionado) porque o repositório é público: senha em texto no código vira
 * senha publicada. Sem a variável definida, o seed para em vez de cair num
 * padrão fraco e conhecido. */
function senhaPadrao(): string {
  const senha = process.env.SEED_PASSWORD;
  if (!senha) {
    throw new Error('Defina SEED_PASSWORD no .env antes de rodar o seed (ver .env.example).');
  }
  return senha;
}

async function upsertUsuario(name: string, email: string, role: Parameters<typeof prisma.user.create>[0]['data']['role']) {
  const passwordHash = await hashPassword(senhaPadrao());
  return prisma.user.upsert({
    where: { email },
    create: { name, email, passwordHash, role },
    update: { name, role, active: true },
  });
}

async function seedImpostos(empresaId: string) {
  const hoje = new Date();
  const competencia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  await prisma.imposto.createMany({
    data: [
      {
        empresaId,
        tipo: 'ISS',
        competencia,
        vencimento: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 10),
        valorEstimado: '4200.00',
        situacao: 'ESTIMADO',
        observacoes: 'Estimativa automática — aguardando confirmação da contabilidade.',
      },
      {
        empresaId,
        tipo: 'PIS/COFINS',
        competencia,
        vencimento: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 25),
        valorEstimado: '9800.00',
        valorConfirmado: '9750.32',
        situacao: 'CONFIRMADO',
      },
      {
        empresaId,
        tipo: 'IRPJ',
        competencia: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
        vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 20),
        valorEstimado: '15300.00',
        valorConfirmado: '15300.00',
        valorPago: '15300.00',
        dataPagamento: new Date(hoje.getFullYear(), hoje.getMonth(), 18),
        situacao: 'PAGO',
        codigoGuia: 'DARF-2026-0417',
      },
    ],
    skipDuplicates: true,
  });
}

async function main() {
  console.log('Seed: criando empresas, usuários e disparando sincronização simulada...');

  const empresaMatriz = await prisma.empresa.upsert({
    where: { cnpj: '12345678000190' },
    create: { cnpj: '12345678000190', razaoSocial: 'Mouro Soluções Ltda', nomeFantasia: 'Mouro Soluções' },
    update: {},
  });

  const empresaFilial = await prisma.empresa.upsert({
    where: { cnpj: '12345678000271' },
    create: { cnpj: '12345678000271', razaoSocial: 'Mouro Participações Ltda', nomeFantasia: 'Mouro Participações' },
    update: {},
  });

  await Promise.all([
    upsertUsuario('Administrador', 'admin@mourosolucoes.com.br', 'ADMINISTRADOR'),
    upsertUsuario('Financeiro', 'Financeiro@mourosolucoes.com.br', 'FINANCEIRO'),
    upsertUsuario('Contabilidade', 'contabilidade@mourosolucoes.com.br', 'CONTABILIDADE'),
    upsertUsuario('Diretoria', 'diretoria@mourosolucoes.com.br', 'DIRETORIA'),
    upsertUsuario('Visualizador', 'visualizador@mourosolucoes.com.br', 'VISUALIZADOR'),
  ]);

  for (const empresa of [empresaMatriz, empresaFilial]) {
    console.log(`Sincronizando dados simulados para ${empresa.nomeFantasia}...`);
    const resultado = await runSync(empresa.id, { trigger: 'MANUAL' });
    console.log(
      `  -> status=${resultado.status} criados=${resultado.totalCreated} atualizados=${resultado.totalUpdated} falhas=${resultado.totalFailed}`,
    );
    await seedImpostos(empresa.id);
  }

  console.log('\nSeed concluído. Login de demonstração (mesma senha para todos):');
  console.log('  Senha: a definida em SEED_PASSWORD no .env');
  console.log('  admin@mourosolucoes.com.br (Administrador)');
  console.log('  Financeiro@mourosolucoes.com.br (Financeiro)');
  console.log('  contabilidade@mourosolucoes.com.br (Contabilidade)');
  console.log('  diretoria@mourosolucoes.com.br (Diretoria)');
  console.log('  visualizador@mourosolucoes.com.br (Visualizador)');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
