import { prisma } from '@/server/db/prisma';
import { logAction } from '@/server/audit/logAction';
import { computeApiKeyStatus } from '@/server/integracoes/apiKeyStatus';
import { generateApiToken } from '@/server/integracoes/apiToken';
import type { Pagination } from '@/shared/schemas/common.schema';
import type { RoleName } from '@/shared/types/rbac.types';
import { withAuthz } from './withAuthz';

/** Nunca selecionar `tokenHash` para fora daqui — o hash não tem uso na UI e
 * vazá-lo para o cliente só amplia a superfície de ataque à toa. */
const API_KEY_PUBLIC_SELECT = {
  id: true,
  nome: true,
  prefixo: true,
  role: true,
  ativo: true,
  expiraEm: true,
  ultimoUsoEm: true,
  revogadoEm: true,
  createdAt: true,
  criadoPor: { select: { name: true, email: true } },
} as const;

export const listApiKeys = withAuthz('integracoes', 'read', async (_session, pagination: Pagination) => {
  const [chaves, total] = await Promise.all([
    prisma.apiKey.findMany({
      orderBy: [{ ativo: 'desc' }, { createdAt: 'desc' }],
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
      select: API_KEY_PUBLIC_SELECT,
    }),
    prisma.apiKey.count(),
  ]);

  // Status é resolvido aqui, e não na tela, porque depende do relógio —
  // calcular durante o render tornaria o componente impuro.
  const agora = new Date();
  const rows = chaves.map((chave) => ({ ...chave, status: computeApiKeyStatus(chave, agora) }));

  return { rows, total, page: pagination.page, pageSize: pagination.pageSize };
});

interface CreateApiKeyInput {
  nome: string;
  role: RoleName;
  expiraEm?: Date | null;
}

/**
 * Retorna o token em claro — é a ÚNICA vez que ele existe fora do cliente.
 * A partir daqui só o SHA-256 fica no banco; perdeu, cria outra.
 */
export const createApiKey = withAuthz(
  'integracoes',
  'create',
  async (session, empresaId: string, input: CreateApiKeyInput) => {
    const { token, tokenHash, prefixo } = generateApiToken();

    const apiKey = await prisma.apiKey.create({
      data: {
        nome: input.nome,
        prefixo,
        tokenHash,
        role: input.role,
        expiraEm: input.expiraEm ?? null,
        criadoPorId: session.userId,
      },
      select: API_KEY_PUBLIC_SELECT,
    });

    await logAction({
      empresaId,
      actorType: session.apiKeyId ? 'API' : 'USUARIO',
      userId: session.userId,
      action: 'INTEGRACAO_CHAVE_CRIAR',
      entityType: 'ApiKey',
      entityId: apiKey.id,
      afterData: apiKey,
    });

    return { apiKey, token };
  },
);

/** Revogar é irreversível de propósito — reativar uma chave que já vazou
 * seria um pé na porta; o caminho correto é criar outra. */
export const revokeApiKey = withAuthz(
  'integracoes',
  'delete',
  async (session, empresaId: string, apiKeyId: string) => {
    const before = await prisma.apiKey.findUniqueOrThrow({
      where: { id: apiKeyId },
      select: API_KEY_PUBLIC_SELECT,
    });

    const apiKey = await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { ativo: false, revogadoEm: new Date() },
      select: API_KEY_PUBLIC_SELECT,
    });

    await logAction({
      empresaId,
      actorType: session.apiKeyId ? 'API' : 'USUARIO',
      userId: session.userId,
      action: 'INTEGRACAO_CHAVE_REVOGAR',
      entityType: 'ApiKey',
      entityId: apiKey.id,
      beforeData: before,
      afterData: apiKey,
    });

    return apiKey;
  },
);
