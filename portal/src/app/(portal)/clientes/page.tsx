import { z } from 'zod';
import { listClientes } from '@/server/data-access/clientes.repo';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';

const pageSchema = z.coerce.number().int().min(1).default(1);

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const busca = typeof rawParams.busca === 'string' ? rawParams.busca : undefined;
  const page = pageSchema.parse(rawParams.page);

  const resultado = await listClientes(undefined, busca, { page, pageSize: 25 });

  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-ink">Clientes</h1>
      <form method="GET" className="mb-4 flex gap-2">
        <input
          type="text"
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome..."
          className="w-64 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass"
        />
      </form>
      <Card>
        <CardContent>
          {resultado.rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th className="py-2 pr-3 font-normal">Nome</th>
                    <th className="py-2 pr-3 font-normal">Documento</th>
                    <th className="py-2 pr-3 font-normal">E-mail</th>
                    <th className="py-2 pr-3 font-normal">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.rows.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-ink">{cliente.nome}</td>
                      <td className="py-2 pr-3 font-mono-num text-muted">{cliente.documento ?? '—'}</td>
                      <td className="py-2 pr-3 text-muted">{cliente.email ?? '—'}</td>
                      <td className="py-2 pr-3 font-mono-num text-muted">{cliente.telefone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted">{resultado.total} cliente(s)</p>
        </CardContent>
      </Card>
    </div>
  );
}
