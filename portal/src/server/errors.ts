import { NextResponse } from 'next/server';

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão inválida ou expirada.');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(resource: string, action: string) {
    super(`Sem permissão para ${action} em ${resource}.`);
    this.name = 'ForbiddenError';
  }
}

export function toHttpError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ erro: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ erro: error.message }, { status: 403 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ erro: error.message }, { status: 400 });
  }
  return NextResponse.json({ erro: 'Erro inesperado.' }, { status: 500 });
}
