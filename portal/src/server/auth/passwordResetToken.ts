import { createHash, randomBytes } from 'node:crypto';

/** 32 bytes = 256 bits de entropia — o mesmo raciocínio do `apiToken.ts`:
 * força bruta é inviável, então SHA-256 (rápido) já basta pra verificar. */
const TOKEN_BYTES = 32;
/** 1h — curto o suficiente pra reduzir a janela de um link vazado (e-mail
 * é um canal menos controlado que a sessão do portal). */
const TOKEN_TTL_MS = 60 * 60 * 1000;

export interface GeneratedResetToken {
  /** Token completo, enviado por e-mail — nunca persistido em claro. */
  token: string;
  /** SHA-256 do token, o único formato salvo no banco. */
  tokenHash: string;
  expiresAt: Date;
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function generateResetToken(): GeneratedResetToken {
  const token = randomBytes(TOKEN_BYTES).toString('base64url');
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  };
}
