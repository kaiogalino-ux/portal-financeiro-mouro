import { z } from 'zod';
import { requireRole } from '@/server/auth/requireRole';
import { listUsuarios } from '@/server/data-access/usuarios.repo';
import { createUsuarioAction } from '@/actions/usuarios.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { UsuarioAtivoToggle } from '@/components/usuarios/UsuarioAtivoToggle';
import type { RoleName } from '@/shared/types/rbac.types';

const pageSchema = z.coerce.number().int().min(1).default(1);

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(['ADMINISTRADOR']);
  const rawParams = await searchParams;
  const page = pageSchema.parse(rawParams.page);
  const resultado = await listUsuarios({ page, pageSize: 25 });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl text-ink">Usuários e Permissões</h1>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUsuarioAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              name="name"
              placeholder="Nome"
              required
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
            />
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              required
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
            />
            <input
              name="password"
              type="password"
              placeholder="Senha provisória"
              required
              minLength={8}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
            />
            <select
              name="role"
              defaultValue="VISUALIZADOR"
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink"
            >
              {(Object.keys(ROLE_LABELS) as RoleName[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <Button type="submit" className="sm:col-span-2 lg:col-span-1">
              Criar usuário
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-3 font-normal">Nome</th>
                  <th className="py-2 pr-3 font-normal">E-mail</th>
                  <th className="py-2 pr-3 font-normal">Perfil</th>
                  <th className="py-2 pr-3 font-normal">Status</th>
                  <th className="py-2 pr-3 font-normal" />
                </tr>
              </thead>
              <tbody>
                {resultado.rows.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 text-ink">{usuario.name}</td>
                    <td className="py-2 pr-3 text-muted">{usuario.email}</td>
                    <td className="py-2 pr-3 text-muted">{ROLE_LABELS[usuario.role]}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={usuario.active ? 'favorable' : 'alert'}>{usuario.active ? 'Ativo' : 'Inativo'}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <UsuarioAtivoToggle userId={usuario.id} active={usuario.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
