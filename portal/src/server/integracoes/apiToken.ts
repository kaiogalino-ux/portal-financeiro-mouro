import { createHash, randomBytes } from 'node:crypto';

/** Prefixo fixo — deixa óbvio, num log ou repositório, que a string vazada
 * é uma chave do Portal Financeiro Mouro (e não outra credencial qualquer). */
const TOKEN_PREFIX = 'pfm';
/** 32 bytes = 256 bits de entropia. Força bruta é inviável, o que permite
 * usar SHA-256 (rápido) em vez de bcrypt para verificar a cada requisição. */
const TOKEN_BYTES = 32;
/** Quanto do token fica visível na tela para o usuário reconhecer a chave. */
const VISIBLE_CHARS = 8;

export interface GeneratedToken {
  /** Token completo — mostrado UMA única vez, nunca mais recuperável. */
  token: string;
  /** SHA-256 do token, o único formato persistido. */
  tokenHash: string;
  /** Trecho em claro só para exibição, ex.: "pfm_a1b2c3d4…". */
  prefixo: string;
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function generateApiToken(): GeneratedToken {
  const random = randomBytes(TOKEN_BYTES).toString('base64url');
  const token = `${TOKEN_PREFIX}_${random}`;
  return {
    token,
    tokenHash: hashApiToken(token),
    prefixo: `${TOKEN_PREFIX}_${random.slice(0, VISIBLE_CHARS)}`,
  };
}

/** Extrai o token de um header `Authorization: Bearer <token>`. */
export function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const [esquema, valor] = authorizationHeader.split(' ');
  if (!esquema || !valor || esquema.toLowerCase() !== 'bearer') return null;
  return valor.trim() || null;
}
