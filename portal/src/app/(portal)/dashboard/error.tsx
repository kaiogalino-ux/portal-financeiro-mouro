'use client';

import { InlineErrorState } from '@/components/ui/States';

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <InlineErrorState mensagem="Não foi possível carregar o dashboard agora." onRetry={reset} />;
}
