import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { ApiAuthError, toHttpError } from '@/server/errors';
import { runAsApiActor, type ApiActor } from './apiActorContext';
import { hashApiToken, parseBearerToken } from './apiToken';

/**
 * Resolve o header Authorization numa chave de API válida.
 *
 * A busca é feita pelo hash (índice único), não pelo token — o token em
 * claro nunca existe no banco, então nem um dump completo permitiria
 * autenticar. Mensagens de erro são propositalmente genéricas quanto ao
 * motivo exato de a chave não servir, para não virar oráculo de tokens.
 */
export async function resolveApiActor(request: NextRequest): Promise<ApiActor> {
  const token = parseBearerToken(request.headers.get('authorization'));
  if (!token) {
    throw new ApiAuthError('Autenticação ausente. Envie a chave no header "Authorization: Bearer <token>".');
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { tokenHash: hashApiToken(token) },
    select: { id: true, nome: true, role: true, ativo: true, expiraEm: true },
  });

  if (!apiKey || !apiKey.ativo) throw new ApiAuthError('Chave de API inválida ou revogada.');
  if (apiKey.expiraEm && apiKey.expiraEm.getTime() < Date.now()) {
    throw new ApiAuthError('Chave de API expirada.');
  }

  // Registrar o uso é conveniência de auditoria, não parte da autenticação —
  // se essa escrita falhar, a requisição legítima não deve cair junto.
  void prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { ultimoUsoEm: new Date() } })
    .catch(() => undefined);

  return { apiKeyId: apiKey.id, nome: apiKey.nome, role: apiKey.role };
}

/**
 * Envelopa um handler de rota /api/v1: autentica a chave e roda o handler
 * dentro do contexto do ator, para que os repositórios já existentes
 * (todos com `withAuthz`) apliquem as permissões do perfil da chave sem
 * nenhuma query duplicada.
 */
export function withApiKey<TCtx = unknown>(
  handler: (request: NextRequest, ctx: TCtx, actor: ApiActor) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ctx: TCtx): Promise<NextResponse> => {
    try {
      const actor = await resolveApiActor(request);
      return await runAsApiActor(actor, () => handler(request, ctx, actor));
    } catch (error) {
      return toHttpError(error);
    }
  };
}
