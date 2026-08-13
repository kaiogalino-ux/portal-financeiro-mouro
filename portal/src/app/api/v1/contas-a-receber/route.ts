import { NextResponse } from 'next/server';
import { listContasAReceber } from '@/server/data-access/titulos.repo';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parseFilters, parsePagination } from '@/server/integracoes/apiHelpers';

export const GET = withApiKey(async (request) => {
  const resultado = await listContasAReceber(parseFilters(request), parsePagination(request));
  return NextResponse.json(resultado);
});
