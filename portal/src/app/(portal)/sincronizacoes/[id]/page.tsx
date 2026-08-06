import Link from 'next/link';
import { getSyncRunDetalhe } from '@/server/data-access/sincronizacoes.repo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/shared/format/date';

export default async function SyncRunDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getSyncRunDetalhe(id);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/sincronizacoes" className="text-xs text-brass underline underline-offset-2">
          ← Voltar
        </Link>
        <h1 className="mt-2 font-display text-xl text-ink">Sincronização {run.id.slice(0, 8)}</h1>
        <p className="text-sm text-muted">
          {run.isSimulated ? 'Dados simulados' : 'Dados reais'} · adaptador {run.erpAdapterName} ·{' '}
          {run.startedAt ? formatDateTime(run.startedAt) : '—'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recursos processados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-3 font-normal">Recurso</th>
                  <th className="py-2 pr-3 font-normal">Status</th>
                  <th className="py-2 pr-3 font-normal">Páginas</th>
                  <th className="py-2 pr-3 font-normal">Registros</th>
                  <th className="py-2 pr-3 font-normal">Criados</th>
                  <th className="py-2 pr-3 font-normal">Atualizados</th>
                  <th className="py-2 pr-3 font-normal">Falhas</th>
                </tr>
              </thead>
              <tbody>
                {run.resourceRuns.map((resourceRun) => (
                  <tr key={resourceRun.id} className="border-b border-border/60">
                    <td className="py-2 pr-3 text-ink">{resourceRun.resource}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={resourceRun.falhas > 0 ? 'alert' : 'favorable'}>{resourceRun.status}</Badge>
                    </td>
                    <td className="py-2 pr-3 font-mono-num text-muted">
                      {resourceRun.ultimaPaginaProcessada ?? '—'}/{resourceRun.paginasTotais ?? '—'}
                    </td>
                    <td className="py-2 pr-3 font-mono-num text-ink">{resourceRun.registrosTotal ?? '—'}</td>
                    <td className="py-2 pr-3 font-mono-num text-favorable">{resourceRun.criados}</td>
                    <td className="py-2 pr-3 font-mono-num text-brass">{resourceRun.atualizados}</td>
                    <td className="py-2 pr-3 font-mono-num text-alert">{resourceRun.falhas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log ({run.logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {run.logs.length === 0 ? (
            <p className="text-sm text-muted">Sem erros registrados.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {run.logs.map((log) => (
                <li key={log.id} className="border-b border-border/60 pb-2">
                  <span className="mr-2 text-xs text-alert">[{log.level}]</span>
                  <span className="text-muted">{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
