'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { triggerManualSync } from '@/actions/sincronizacoes.actions';

export function TriggerSyncButton({ empresaId }: { empresaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErro(null);
    try {
      await triggerManualSync(empresaId);
      router.refresh();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Falha ao sincronizar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleClick} disabled={loading}>
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Sincronizando...' : 'Sincronizar agora (dados simulados)'}
      </Button>
      {erro && <span className="text-xs text-alert">{erro}</span>}
    </div>
  );
}
