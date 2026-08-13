import { NextResponse } from 'next/server';
import { listSyncRuns, triggerSyncViaApi } from '@/server/data-access/sincronizacoes.repo';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parsePagination, queryParams, resolveEmpresaId } from '@/server/integracoes/apiHelpers';

/** Histórico de sincronizações. */
export const GET = withApiKey(async (request) => {
  const { empresaId } = queryParams(request);
  const resultado = await listSyncRuns(empresaId || undefined, parsePagination(request));
  return NextResponse.json(resultado);
});

/**
 * Dispara uma sincronização com o Gestão Click. É a única escrita da API —
 * e mesmo assim não altera dado financeiro: só atualiza a cópia local a
 * partir do ERP. Exige perfil com permissão de criar em `sincronizacoes`
 * (Administrador ou Financeiro).
 *
 * Roda de forma síncrona: a sincronização completa leva ~1 min, então quem
 * chama deve usar um timeout compatível.
 */
export const POST = withApiKey(async (request) => {
  const { empresaId } = queryParams(request);
  const resultado = await triggerSyncViaApi(await resolveEmpresaId(empresaId || undefined));
  return NextResponse.json(resultado);
});
