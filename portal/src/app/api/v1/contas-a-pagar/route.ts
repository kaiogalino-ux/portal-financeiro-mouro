import { NextResponse } from 'next/server';
import { listContasAPagar } from '@/server/data-access/titulos.repo';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parseFilters, parsePagination } from '@/server/integracoes/apiHelpers';

export const GET = withApiKey(async (request) => {
  const resultado = await listContasAPagar(parseFilters(request), parsePagination(request));
  return NextResponse.json(resultado);
});
