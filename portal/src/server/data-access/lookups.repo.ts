import { auth } from '@/server/auth/auth';
import { prisma } from '@/server/db/prisma';
import { UnauthorizedError } from '@/server/errors';

/**
 * Listas de referência (empresas, centros de custo, categorias) usadas nos
 * filtros globais em várias páginas. Não são dados sensíveis por si só —
 * exigem só sessão ativa, não uma permissão de recurso específica (a
 * autorização real acontece quando os filtros são aplicados às consultas de
 * dashboard/títulos, que passam por withAuthz normalmente).
 */
async function requireActiveSession() {
  const session = await auth();
  if (!session?.user?.active) throw new UnauthorizedError();
  return session;
}

export async function listEmpresasLookup() {
  await requireActiveSession();
  return prisma.empresa.findMany({
    where: { ativo: true },
    orderBy: { razaoSocial: 'asc' },
    select: { id: true, cnpj: true, razaoSocial: true, nomeFantasia: true },
  });
}

export async function listCentrosCustoLookup(empresaId?: string) {
  await requireActiveSession();
  return prisma.centroCusto.findMany({
    where: { ativo: true, ...(empresaId ? { empresaId } : {}) },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true },
  });
}

export async function listCategoriasLookup(empresaId?: string) {
  await requireActiveSession();
  return prisma.categoriaFinanceira.findMany({
    where: { ativo: true, ...(empresaId ? { empresaId } : {}) },
    orderBy: { nome: 'asc' },
    select: { id: true, nome: true, tipo: true },
  });
}
