import { Construction } from 'lucide-react';

export function EmConstrucao({ titulo, descricao }: { titulo: string; descricao: string }) {
  return (
    <div>
      <h1 className="mb-4 font-display text-xl text-ink">{titulo}</h1>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface py-16 text-center">
        <Construction size={28} className="text-brass" />
        <p className="max-w-md text-sm text-muted">{descricao}</p>
        <p className="text-xs text-muted/70">
          A base de dados e a autorização já existem para este módulo — falta só a interface.
        </p>
      </div>
    </div>
  );
}
