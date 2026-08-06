import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getKpi } from '@/server/dashboard/kpis';
import { toHttpError } from '@/server/errors';
import { dashboardFiltersSchema, kpiKeySchema } from '@/shared/schemas/dashboard.schema';

const ALL_KEYS = kpiKeySchema.options;

export async function GET(request: NextRequest) {
  try {
    const filters = dashboardFiltersSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const resultados = await Promise.all(ALL_KEYS.map((key) => getKpi(key, filters)));
    return NextResponse.json(resultados);
  } catch (error) {
    return toHttpError(error);
  }
}
