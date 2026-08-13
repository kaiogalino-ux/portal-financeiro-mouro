import path from 'node:path';
import { z } from 'zod';
import { requireRole } from '@/server/auth/requireRole';
import { listApiKeys } from '@/server/data-access/integracoes.repo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import { NovaChaveForm } from '@/components/integracoes/NovaChaveForm';
import { RevogarChaveButton } from '@/components/integracoes/RevogarChaveButton';
import { GuiaConexao } from '@/components/integracoes/GuiaConexao';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { formatDateTime } from '@/shared/format/date';

import type { ApiKeyStatus } from '@/server/integracoes/apiKeyStatus';

const pageSchema = z.coerce.number().int().min(1).default(1);

const STATUS_LABELS: Record<ApiKeyStatus, string> = {
  ATIVA: 'Ativa',
  REVOGADA: 'Revogada',
  EXPIRADA: 'Expirada',
};

export default async function IntegracoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole(['ADMINISTRADOR']);
  const rawParams = await searchParams;
  const page = pageSchema.parse(rawParams.page);
  const chaves = await listApiKeys({ page, pageSize: 25 });

  const baseUrl = process.env.PORTAL_PUBLIC_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000';
  const caminhoMcp = path.join(process.cwd(), 'mcp', 'portalFinanceiroMcp.mjs');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-ink">Integrações</h1>
        <p className="mt-1 text-sm text-muted">
          Conecte o portal a outros aplicativos. Cada chave herda um perfil e enxerga exatamente o que um usuário
          daquele perfil enxergaria — nada além.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova chave de API</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaChaveForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chaves existentes</CardTitle>
        </CardHeader>
        <CardContent>
          {chaves.rows.length === 0 ? (
            <EmptyState mensagem="Nenhuma chave criada ainda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2 pr-3 font-normal">Nome</th>
                    <th className="py-2 pr-3 font-normal">Chave</th>
                    <th className="py-2 pr-3 font-normal">Perfil</th>
                    <th className="py-2 pr-3 font-normal">Último uso</th>
                    <th className="py-2 pr-3 font-normal">Status</th>
                    <th className="py-2 pr-3 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {chaves.rows.map((chave) => (
                    <tr key={chave.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-ink">{chave.nome}</td>
                      <td className="py-2 pr-3 font-mono-num text-xs text-muted">{chave.prefixo}…</td>
                      <td className="py-2 pr-3 text-muted">{ROLE_LABELS[chave.role]}</td>
                      <td className="py-2 pr-3 text-muted">
                        {chave.ultimoUsoEm ? formatDateTime(chave.ultimoUsoEm) : 'Nunca usada'}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge tone={chave.status === 'ATIVA' ? 'favorable' : 'alert'}>
                          {STATUS_LABELS[chave.status]}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3">
                        {chave.status === 'ATIVA' && <RevogarChaveButton apiKeyId={chave.id} nome={chave.nome} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg text-ink">Como conectar</h2>
        <GuiaConexao baseUrl={baseUrl} caminhoMcp={caminhoMcp} />
      </div>
    </div>
  );
}
