import { describe, expect, it } from 'vitest';
import { generateApiToken, hashApiToken, parseBearerToken } from '@/server/integracoes/apiToken';

describe('generateApiToken', () => {
  it('gera tokens únicos a cada chamada', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateApiToken().token));
    expect(tokens.size).toBe(50);
  });

  it('o hash guardado corresponde ao token, e o token não é derivável do prefixo', () => {
    const { token, tokenHash, prefixo } = generateApiToken();
    expect(hashApiToken(token)).toBe(tokenHash);
    // O prefixo é curto o bastante para não permitir reconstruir o token.
    expect(token.startsWith(prefixo)).toBe(true);
    expect(prefixo.length).toBeLessThan(token.length / 2);
  });

  it('não guarda o token em claro em nenhum campo persistido', () => {
    const { token, tokenHash, prefixo } = generateApiToken();
    expect(tokenHash).not.toContain(token);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(prefixo).not.toBe(token);
  });
});

describe('parseBearerToken', () => {
  it('extrai o token de um header Bearer válido, ignorando a caixa do esquema', () => {
    expect(parseBearerToken('Bearer pfm_abc123')).toBe('pfm_abc123');
    expect(parseBearerToken('bearer pfm_abc123')).toBe('pfm_abc123');
  });

  it('rejeita header ausente, vazio ou de outro esquema', () => {
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken('')).toBeNull();
    expect(parseBearerToken('Basic dXNlcjpwYXNz')).toBeNull();
    expect(parseBearerToken('Bearer')).toBeNull();
    expect(parseBearerToken('Bearer   ')).toBeNull();
  });
});
