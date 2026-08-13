import { NextResponse } from 'next/server';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { readableResources } from '@/shared/constants/roles';

/** Diagnóstico: confirma que a chave é válida e mostra o que ela alcança.
 * É o primeiro endpoint a chamar ao configurar qualquer integração. */
export const GET = withApiKey(async (_request, _ctx, actor) => {
  return NextResponse.json({
    chave: actor.nome,
    perfil: actor.role,
    perfilLabel: ROLE_LABELS[actor.role],
    recursosLegiveis: Array.from(readableResources(actor.role)).sort(),
  });
});
