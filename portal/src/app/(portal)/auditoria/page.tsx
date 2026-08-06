import { z } from 'zod';
import { listAuditLogs } from '@/server/data-access/auditoria.repo';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { formatDateTime } from '@/shared/format/date';

const pageSchema = z.coerce.number().int().min(1).default(1);

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const page = pageSchema.parse(rawParams.page);
  const resultado = await listAuditLogs(undefined, { page, pageSize: 30 });

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-ink">Auditoria</h1>
      <Card>
        <CardContent>
          {resultado.rows.length === 0 ? (
            <EmptyState mensagem="Nenhuma ação registrada ainda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2 pr-3 font-normal">Quando</th>
                    <th className="py-2 pr-3 font-normal">Quem</th>
                    <th className="py-2 pr-3 font-normal">Ação</th>
                    <th className="py-2 pr-3 font-normal">Entidade</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.rows.map((log) => (
                    <tr key={log.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-mono-num text-muted">{formatDateTime(log.createdAt)}</td>
                      <td className="py-2 pr-3 text-ink">
                        {log.actorType === 'SINCRONIZACAO' ? 'Sincronização' : log.user?.name ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-muted">{log.action}</td>
                      <td className="py-2 pr-3 font-mono-num text-muted">
                        {log.entityType}#{log.entityId.slice(0, 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
