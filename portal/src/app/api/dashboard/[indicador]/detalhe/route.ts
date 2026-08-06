import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getKpiDetalhe } from '@/server/dashboard/kpis';
import { toHttpError } from '@/server/errors';
import { drilldownQuerySchema, kpiKeySchema } from '@/shared/schemas/dashboard.schema';

export async function GET(request: NextRequest, { params }: { params: Promise<{ indicador: string }> }) {
  try {
    const { indicador } = await params;
    const key = kpiKeySchema.parse(indicador);
    const query = drilldownQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const { page, pageSize, ...filters } = query;

    const resultado = await getKpiDetalhe(key, filters, { page, pageSize });
    return NextResponse.json(resultado);
  } catch (error) {
    return toHttpError(error);
  }
}
