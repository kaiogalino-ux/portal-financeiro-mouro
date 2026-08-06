import { requireRole } from '@/server/auth/requireRole';
import { EmConstrucao } from '@/components/ui/EmConstrucao';

export default async function NotasEmitidasPage() {
  await requireRole(['ADMINISTRADOR', 'FINANCEIRO', 'CONTABILIDADE', 'DIRETORIA']);
  return (
    <EmConstrucao
      titulo="Notas Emitidas"
      descricao="As notas fiscais já são sincronizadas (ver contagem em Sincronizações) e alimentam o indicador 'Faturamento do mês' no Resumo — a listagem detalhada com filtros por situação entra na próxima iteração."
    />
  );
}
