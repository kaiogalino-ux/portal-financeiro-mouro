import Link from 'next/link';
import { z } from 'zod';
import { listSyncRuns } from '@/server/data-access/sincronizacoes.repo';
import { listEmpresasLookup } from '@/server/data-access/lookups.repo';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import { TriggerSyncButton } from '@/components/sincronizacoes/TriggerSyncButton';
import { formatDateTime } from '@/shared/format/date';
import type { SyncRunStatus } from '@/generated/prisma';

const pageSchema = z.coerce.number().int().min(1).default(1);

const STATUS_TONE: Record<SyncRunStatus, { label: string; tone: BadgeTone }> = {
  PENDENTE: { label: 'Pendente', tone: 'neutral' },
  EM_EXECUCAO: { label: 'Em execução', tone: 'brass' },
  SUCESSO: { label: 'Sucesso', tone: 'favorable' },
  PARCIAL: { label: 'Parcial', tone: 'neutral' },
  FALHOU: { label: 'Falhou', tone: 'alert' },
};

export default async function SincronizacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const page = pageSchema.parse(rawParams.page);
  const empresas = await listEmpresasLookup();
  const empresaId = typeof rawParams.empresaId === 'string' ? rawParams.empresaId : empresas[0]?.id;

  const resultado = empresaId
    ? await listSyncRuns(empresaId, { page, pageSize: 20 })
    : { rows: [], total: 0, page: 1, pageSize: 20 };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Sincronizações</h1>
        {empresaId && <TriggerSyncButton empresaId={empresaId} />}
      </div>

      <form method="GET" className="mb-4">
        <select
          name="empresaId"
          defaultValue={empresaId}
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink"
        >
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nomeFantasia ?? empresa.razaoSocial}
            </option>
          ))}
        </select>
      </form>

      <Card>
        <CardContent>
          {resultado.rows.length === 0 ? (
            <EmptyState mensagem="Nenhuma sincronização ainda. Clique em 'Sincronizar agora' para popular o portal com dados simulados." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2 pr-3 font-normal">Início</th>
                    <th className="py-2 pr-3 font-normal">Disparo</th>
                    <th className="py-2 pr-3 font-normal">Status</th>
                    <th className="py-2 pr-3 font-normal">Buscados</th>
                    <th className="py-2 pr-3 font-normal">Criados</th>
                    <th className="py-2 pr-3 font-normal">Atualizados</th>
                    <th className="py-2 pr-3 font-normal">Falhas</th>
                    <th className="py-2 pr-3 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {resultado.rows.map((run) => {
                    const status = STATUS_TONE[run.status];
                    return (
                      <tr key={run.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-mono-num text-muted">
                          {run.startedAt ? formatDateTime(run.startedAt) : '—'}
                        </td>
                        <td className="py-2 pr-3 text-muted">
                          {run.trigger === 'MANUAL' ? `Manual (${run.triggeredByUser?.name ?? '—'})` : 'Agendado'}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="py-2 pr-3 font-mono-num text-ink">{run.totalFetched}</td>
                        <td className="py-2 pr-3 font-mono-num text-favorable">{run.totalCreated}</td>
                        <td className="py-2 pr-3 font-mono-num text-brass">{run.totalUpdated}</td>
                        <td className="py-2 pr-3 font-mono-num text-alert">{run.totalFailed}</td>
                        <td className="py-2 pr-3">
                          <Link href={`/sincronizacoes/${run.id}`} className="text-xs text-brass underline underline-offset-2">
                            Ver detalhe
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
