import { NextResponse } from 'next/server';
import { listClientes } from '@/server/data-access/clientes.repo';
import { withApiKey } from '@/server/integracoes/apiAuth';
import { parsePagination, queryParams } from '@/server/integracoes/apiHelpers';

export const GET = withApiKey(async (request) => {
  const { empresaId, busca } = queryParams(request);
  const resultado = await listClientes(empresaId || undefined, busca || undefined, parsePagination(request));
  return NextResponse.json(resultado);
});
