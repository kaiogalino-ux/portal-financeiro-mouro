'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/server/auth/requireRole';
import { createApiKey, revokeApiKey } from '@/server/data-access/integracoes.repo';
import { listEmpresasLookup } from '@/server/data-access/lookups.repo';
import type { RoleName } from '@/shared/types/rbac.types';

// Chave de API é global (não pertence a uma empresa), mas AuditLog exige
// empresaId para poder ser filtrada junto do resto — mesma âncora usada em
// usuarios.actions.ts.
async function primeiraEmpresaId(): Promise<string> {
  const empresas = await listEmpresasLookup();
  const primeira = empresas[0];
  if (!primeira) throw new Error('Nenhuma empresa cadastrada — rode o seed antes de criar chaves de API.');
  return primeira.id;
}

const criarChaveSchema = z.object({
  nome: z.string().trim().min(1, 'Dê um nome para identificar a chave (ex.: "Claude Desktop").').max(80),
  role: z.enum(['ADMINISTRADOR', 'FINANCEIRO', 'CONTABILIDADE', 'DIRETORIA', 'VISUALIZADOR']),
  diasValidade: z.coerce.number().int().min(1).max(3650).optional(),
});

export interface CriarChaveResult {
  ok: boolean;
  erro?: string;
  /** Token em claro — existe só neste retorno, nunca é recuperável depois. */
  token?: string;
  nome?: string;
}

export async function criarChaveApiAction(_prev: CriarChaveResult, formData: FormData): Promise<CriarChaveResult> {
  await requireRole(['ADMINISTRADOR']);

  const parsed = criarChaveSchema.safeParse({
    nome: formData.get('nome'),
    role: formData.get('role'),
    diasValidade: formData.get('diasValidade') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const empresaId = await primeiraEmpresaId();
  const expiraEm = parsed.data.diasValidade
    ? new Date(Date.now() + parsed.data.diasValidade * 24 * 60 * 60 * 1000)
    : null;

  const { token } = await createApiKey(empresaId, {
    nome: parsed.data.nome,
    role: parsed.data.role as RoleName,
    expiraEm,
  });

  revalidatePath('/integracoes');
  return { ok: true, token, nome: parsed.data.nome };
}

export async function revogarChaveApiAction(apiKeyId: string) {
  await requireRole(['ADMINISTRADOR']);
  const empresaId = await primeiraEmpresaId();
  await revokeApiKey(empresaId, apiKeyId);
  revalidatePath('/integracoes');
}
