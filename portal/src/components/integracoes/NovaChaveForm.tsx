'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, KeyRound, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { criarChaveApiAction, type CriarChaveResult } from '@/actions/integracoes.actions';
import { ROLE_LABELS } from '@/shared/constants/roles';
import type { RoleName } from '@/shared/types/rbac.types';

const ESTADO_INICIAL: CriarChaveResult = { ok: false };

const INPUT_CLASS =
  'rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus-visible:border-brass';

export function NovaChaveForm() {
  const router = useRouter();
  const [estado, formAction, pendente] = useActionState(criarChaveApiAction, ESTADO_INICIAL);

  // A lista de chaves é renderizada no servidor; sem o refresh a chave nova
  // só apareceria após uma navegação manual.
  useEffect(() => {
    if (estado.ok) router.refresh();
  }, [estado.ok, estado.token, router]);

  return (
    <div className="space-y-4">
      <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input name="nome" placeholder="Nome (ex.: Claude Desktop)" required maxLength={80} className={INPUT_CLASS} />
        <select name="role" defaultValue="VISUALIZADOR" className={INPUT_CLASS}>
          {(Object.keys(ROLE_LABELS) as RoleName[]).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <input
          name="diasValidade"
          type="number"
          min={1}
          max={3650}
          placeholder="Validade em dias (opcional)"
          className={INPUT_CLASS}
        />
        <Button type="submit" disabled={pendente}>
          <KeyRound size={14} />
          {pendente ? 'Gerando...' : 'Gerar chave'}
        </Button>
      </form>

      {estado.erro && <p className="text-xs text-alert">{estado.erro}</p>}
      {estado.ok && estado.token && <TokenRevelado token={estado.token} nome={estado.nome ?? 'Nova chave'} />}
    </div>
  );
}

function TokenRevelado({ token, nome }: { token: string; nome: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="rounded-xl border border-brass/40 bg-brass-soft/10 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
        <TriangleAlert size={14} className="text-brass" />
        Copie a chave &ldquo;{nome}&rdquo; agora
      </p>
      <p className="mb-3 text-xs text-muted">
        Este é o único momento em que ela aparece. O portal guarda apenas um resumo criptográfico — se perder, não há
        como recuperar, só gerar outra.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono-num text-xs text-ink">
          {token}
        </code>
        <Button type="button" variant="secondary" onClick={copiar}>
          {copiado ? <Check size={14} /> : <Copy size={14} />}
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
    </div>
  );
}
