'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/server/auth/requireRole';
import { createUsuario, updateUsuario } from '@/server/data-access/usuarios.repo';
import { listEmpresasLookup } from '@/server/data-access/lookups.repo';
import type { RoleName } from '@/shared/types/rbac.types';

// Usuário não pertence a uma empresa específica (é global, ver rbac.ts) —
// AuditLog exige empresaId só para poder ser filtrado junto dos outros
// registros de auditoria; usamos a primeira empresa cadastrada como âncora.
async function primeiraEmpresaId(): Promise<string> {
  const empresas = await listEmpresasLookup();
  const primeira = empresas[0];
  if (!primeira) throw new Error('Nenhuma empresa cadastrada — rode o seed antes de criar usuários.');
  return primeira.id;
}

export async function createUsuarioAction(formData: FormData) {
  await requireRole(['ADMINISTRADOR']);
  const empresaId = await primeiraEmpresaId();

  await createUsuario(empresaId, {
    name: String(formData.get('name')),
    email: String(formData.get('email')),
    password: String(formData.get('password')),
    role: String(formData.get('role')) as RoleName,
  });

  revalidatePath('/usuarios');
}

export async function toggleUsuarioAtivoAction(userId: string, active: boolean) {
  await requireRole(['ADMINISTRADOR']);
  const empresaId = await primeiraEmpresaId();
  await updateUsuario(empresaId, userId, { active });
  revalidatePath('/usuarios');
}
