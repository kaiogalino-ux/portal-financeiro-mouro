import { requireRole } from '@/server/auth/requireRole';
import { EmConstrucao } from '@/components/ui/EmConstrucao';

export default async function ImpostosPage() {
  await requireRole(['ADMINISTRADOR', 'CONTABILIDADE']);
  return (
    <EmConstrucao
      titulo="Impostos"
      descricao="O modelo de dados (tipo, competência, vencimento, valor estimado/confirmado/pago, situação, guia, comprovante) e alguns registros de exemplo já existem no banco — a tela de gestão e confirmação pela contabilidade entra na próxima iteração."
    />
  );
}
