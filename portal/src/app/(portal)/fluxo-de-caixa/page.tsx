import { requireRole } from '@/server/auth/requireRole';
import { EmConstrucao } from '@/components/ui/EmConstrucao';

export default async function FluxoDeCaixaPage() {
  await requireRole(['ADMINISTRADOR', 'FINANCEIRO', 'DIRETORIA']);
  return (
    <EmConstrucao
      titulo="Fluxo de Caixa"
      descricao="A visão detalhada de fluxo de caixa (para além do gráfico já disponível no Resumo) entra na próxima iteração — inclui explorar por dia, semana e conta bancária."
    />
  );
}
