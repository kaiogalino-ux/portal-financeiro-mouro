import { NextResponse } from 'next/server';
import { listFornecedores } from '@/server/data-access/fornecedores.repo';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parsePagination, queryParams } from '@/server/integracoes/apiHelpers';

export const GET = withApiKey(async (request) => {
  const { empresaId, busca } = queryParams(request);
  const resultado = await listFornecedores(empresaId || undefined, busca || undefined, parsePagination(request));
  return NextResponse.json(resultado);
});
