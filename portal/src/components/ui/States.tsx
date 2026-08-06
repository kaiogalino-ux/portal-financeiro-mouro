import { AlertTriangle, Inbox } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />;
}

export function EmptyState({ mensagem = 'Nenhum registro para os filtros selecionados.' }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted">
      <Inbox size={28} />
      <p className="text-sm">{mensagem}</p>
    </div>
  );
}

export function InlineErrorState({
  mensagem = 'Não foi possível carregar este indicador agora.',
  onRetry,
}: {
  mensagem?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <AlertTriangle size={24} className="text-alert" />
      <p className="text-sm text-muted">{mensagem}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-medium text-brass underline underline-offset-2"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
