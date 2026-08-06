import { describe, expect, it } from 'vitest';
import { can, readableResources } from '@/shared/constants/roles';

describe('can (matriz de permissões)', () => {
  it('ADMINISTRADOR pode tudo em qualquer recurso', () => {
    expect(can('ADMINISTRADOR', 'delete', 'usuarios')).toBe(true);
    expect(can('ADMINISTRADOR', 'create', 'impostos')).toBe(true);
  });

  it('VISUALIZADOR só lê o dashboard', () => {
    expect(can('VISUALIZADOR', 'read', 'dashboard')).toBe(true);
    expect(can('VISUALIZADOR', 'read', 'contasAPagar')).toBe(false);
    expect(can('VISUALIZADOR', 'create', 'dashboard')).toBe(false);
  });

  it('FINANCEIRO pode criar/atualizar contas a pagar mas não deletar', () => {
    expect(can('FINANCEIRO', 'create', 'contasAPagar')).toBe(true);
    expect(can('FINANCEIRO', 'update', 'contasAPagar')).toBe(true);
    expect(can('FINANCEIRO', 'delete', 'contasAPagar')).toBe(false);
  });

  it('CONTABILIDADE não acessa usuários', () => {
    expect(can('CONTABILIDADE', 'read', 'usuarios')).toBe(false);
  });

  it('DIRETORIA é somente leitura mesmo nos recursos que acessa', () => {
    expect(can('DIRETORIA', 'read', 'contasAPagar')).toBe(true);
    expect(can('DIRETORIA', 'update', 'contasAPagar')).toBe(false);
  });
});

describe('readableResources', () => {
  it('ADMINISTRADOR vê todos os recursos na navegação', () => {
    const resources = readableResources('ADMINISTRADOR');
    expect(resources.has('usuarios')).toBe(true);
    expect(resources.has('auditoria')).toBe(true);
  });

  it('VISUALIZADOR só vê dashboard na navegação', () => {
    const resources = readableResources('VISUALIZADOR');
    expect(Array.from(resources)).toEqual(['dashboard']);
  });
});
