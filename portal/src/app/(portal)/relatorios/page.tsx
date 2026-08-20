import { requireRole } from '@/server/auth/requireRole';
import { EmConstrucao } from '@/components/ui/EmConstrucao';

export default async function RelatoriosPage() {
  await requireRole(['ADMINISTRADOR', 'FINANCEIRO', 'CONTABILIDADE', 'DIRETORIA']);
  return (
    <EmConstrucao
      titulo="Relatórios"
      descricao="Exportação de relatórios (Excel/PDF) reaproveitando os mesmos filtros e consultas do dashboard entra na próxima iteração."
    />
  );
}
