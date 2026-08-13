import { describe, expect, it } from 'vitest';
import { computeApiKeyStatus } from '@/server/integracoes/apiKeyStatus';

const HOJE = new Date('2026-08-13T12:00:00');
const ONTEM = new Date('2026-08-12T12:00:00');
const AMANHA = new Date('2026-08-14T12:00:00');

describe('computeApiKeyStatus', () => {
  it('chave ativa sem validade definida nunca expira', () => {
    expect(computeApiKeyStatus({ ativo: true, revogadoEm: null, expiraEm: null }, HOJE)).toBe('ATIVA');
  });

  it('expira quando a data de validade já passou', () => {
    expect(computeApiKeyStatus({ ativo: true, revogadoEm: null, expiraEm: ONTEM }, HOJE)).toBe('EXPIRADA');
    expect(computeApiKeyStatus({ ativo: true, revogadoEm: null, expiraEm: AMANHA }, HOJE)).toBe('ATIVA');
  });

  it('revogação prevalece sobre validade — chave revogada nunca volta a valer', () => {
    expect(computeApiKeyStatus({ ativo: false, revogadoEm: ONTEM, expiraEm: AMANHA }, HOJE)).toBe('REVOGADA');
  });

  it('`ativo: false` sozinho já conta como revogada', () => {
    expect(computeApiKeyStatus({ ativo: false, revogadoEm: null, expiraEm: null }, HOJE)).toBe('REVOGADA');
  });
});
