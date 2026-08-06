import { requireRole } from '@/server/auth/requireRole';
import { EmConstrucao } from '@/components/ui/EmConstrucao';

export default async function CentrosDeCustoPage() {
  await requireRole(['ADMINISTRADOR', 'FINANCEIRO']);
  return (
    <EmConstrucao
      titulo="Centros de Custo"
      descricao="Os centros de custo já são sincronizados e usados nos filtros e no gráfico 'Resultado por centro de custo' do Resumo — o cadastro/edição direta entra na próxima iteração."
    />
  );
}
