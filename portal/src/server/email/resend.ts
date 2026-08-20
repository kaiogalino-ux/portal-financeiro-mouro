import { Resend } from 'resend';

// Sem domínio verificado no Resend, o remetente cai para o sandbox
// `onboarding@resend.dev`, que só entrega pro e-mail da própria conta
// Resend — suficiente pra testar o fluxo antes de verificar o domínio da
// empresa (ver portal/DEPLOY.md).
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Portal Financeiro Mouro <onboarding@resend.dev>';

function client(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY não configurada — necessária para enviar e-mail.');
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await client().emails.send({
    from: FROM,
    to,
    subject: 'Redefinir senha — Portal Financeiro Mouro',
    html: `
      <p>Recebemos um pedido para redefinir a senha da sua conta no Portal Financeiro Mouro Soluções.</p>
      <p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a>.</p>
      <p>O link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este e-mail — sua senha atual continua válida.</p>
    `,
  });
}
