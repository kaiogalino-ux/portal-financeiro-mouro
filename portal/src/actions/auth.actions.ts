'use server';

import { forgotPasswordSchema, resetPasswordSchema } from '@/shared/schemas/auth.schema';
import { createPasswordResetToken, consumePasswordResetToken } from '@/server/data-access/passwordReset.repo';
import { sendPasswordResetEmail } from '@/server/email/resend';

function publicPortalUrl(): string {
  return process.env.PORTAL_PUBLIC_URL || process.env.AUTH_URL || 'http://localhost:3000';
}

// Sempre retorna sucesso, mesmo quando o e-mail não existe no sistema — do
// contrário o formulário vira uma forma de descobrir quais e-mails têm
// cadastro no portal.
export async function requestPasswordResetAction(formData: FormData): Promise<{ ok: true }> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });

  if (parsed.success) {
    try {
      const token = await createPasswordResetToken(parsed.data.email);
      if (token) {
        const resetUrl = `${publicPortalUrl()}/redefinir-senha?token=${token}`;
        await sendPasswordResetEmail(parsed.data.email, resetUrl);
      }
    } catch (error) {
      // Nunca deixa o cliente saber se o e-mail existia ou se o envio
      // falhou — só loga pro servidor pra dar pra diagnosticar.
      console.error('Falha ao enviar e-mail de redefinição de senha:', error);
    }
  }

  return { ok: true };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const success = await consumePasswordResetToken(parsed.data.token, parsed.data.password);
  if (!success) {
    return { ok: false, error: 'Link inválido ou expirado. Solicite um novo.' };
  }

  return { ok: true };
}
