import { prisma } from '@/server/db/prisma';
import { hashPassword } from '@/server/auth/password';
import { generateResetToken, hashResetToken } from '@/server/auth/passwordResetToken';

// Sem `withAuthz` de propósito: quem chama isso ainda não tem sessão — é
// exatamente o fluxo que existe pra recuperar o acesso quando não há uma.

/**
 * Gera um token de redefinição para o e-mail informado. Retorna `null` sem
 * nenhum detalhe quando o e-mail não corresponde a um usuário ativo — quem
 * chama (a Server Action) sempre responde com a mesma mensagem de sucesso
 * pro cliente, pra não revelar quais e-mails existem no sistema.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, active: true },
  });
  if (!user || !user.active) return null;

  const { token, tokenHash, expiresAt } = generateResetToken();

  await prisma.$transaction([
    // Invalida links anteriores ainda não usados — só o mais recente vale.
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
  ]);

  return token;
}

/**
 * Valida o token e, se ainda válido e não usado, define a nova senha.
 * Retorna `false` pra qualquer motivo de rejeição (token inexistente,
 * expirado ou já consumido) — a mensagem ao usuário é sempre genérica.
 */
export async function consumePasswordResetToken(token: string, newPassword: string): Promise<boolean> {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return false;

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return true;
}
