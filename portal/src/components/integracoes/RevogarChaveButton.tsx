'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { revogarChaveApiAction } from '@/actions/integracoes.actions';

/** Revogar é irreversível — por isso o clique pede confirmação explícita
 * em vez de agir de primeira. */
export function RevogarChaveButton({ apiKeyId, nome }: { apiKeyId: string; nome: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function revogar() {
    setCarregando(true);
    setErro(null);
    try {
      await revogarChaveApiAction(apiKeyId);
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha ao revogar.');
      setCarregando(false);
    }
  }

  if (!confirmando) {
    return (
      <Button variant="ghost" onClick={() => setConfirmando(true)} className="text-xs">
        Revogar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Revogar &ldquo;{nome}&rdquo;?</span>
      <Button variant="secondary" onClick={revogar} disabled={carregando} className="text-xs">
        {carregando ? 'Revogando...' : 'Confirmar'}
      </Button>
      <Button variant="ghost" onClick={() => setConfirmando(false)} disabled={carregando} className="text-xs">
        Cancelar
      </Button>
      {erro && <span className="text-xs text-alert">{erro}</span>}
    </div>
  );
}
