import type { Action, Resource, RoleName } from '@/shared/types/rbac.types';

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMINISTRADOR: 'Administrador',
  FINANCEIRO: 'Financeiro',
  CONTABILIDADE: 'Contabilidade',
  DIRETORIA: 'Diretoria',
  VISUALIZADOR: 'Visualizador',
};

const ALL_ACTIONS: Action[] = ['read', 'create', 'update', 'delete'];

/**
 * Lista exaustiva de recursos. O `satisfies Record<Resource, true>` faz o
 * TypeScript falhar se um recurso novo for adicionado ao union `Resource` e
 * esquecido aqui — antes esta lista era literal e um esquecimento passava
 * silenciosamente, sumindo o item do menu do Administrador.
 */
const ALL_RESOURCES = Object.keys({
  dashboard: true,
  contasAPagar: true,
  contasAReceber: true,
  fluxoDeCaixa: true,
  notasFiscais: true,
  impostos: true,
  centrosDeCusto: true,
  clientes: true,
  fornecedores: true,
  relatorios: true,
  sincronizacoes: true,
  integracoes: true,
  usuarios: true,
  auditoria: true,
} satisfies Record<Resource, true>) as Resource[];

/**
 * Matriz de permissões fixa (perfis não são dinâmicos nesta entrega).
 * '*' cobre todos os recursos. Ausência de uma entrada = sem acesso.
 */
export const ROLE_PERMISSIONS: Record<RoleName, Partial<Record<Resource | '*', Action[]>>> = {
  ADMINISTRADOR: {
    '*': ALL_ACTIONS,
  },
  FINANCEIRO: {
    dashboard: ['read'],
    contasAPagar: ['read', 'create', 'update'],
    contasAReceber: ['read', 'create', 'update'],
    fluxoDeCaixa: ['read'],
    clientes: ['read', 'update'],
    fornecedores: ['read', 'update'],
    centrosDeCusto: ['read'],
    relatorios: ['read'],
    sincronizacoes: ['read', 'create'],
  },
  CONTABILIDADE: {
    dashboard: ['read'],
    impostos: ['read', 'create', 'update'],
    notasFiscais: ['read'],
    relatorios: ['read'],
  },
  DIRETORIA: {
    dashboard: ['read'],
    fluxoDeCaixa: ['read'],
    contasAPagar: ['read'],
    contasAReceber: ['read'],
    relatorios: ['read'],
  },
  VISUALIZADOR: {
    dashboard: ['read'],
  },
};

export function can(role: RoleName, action: Action, resource: Resource): boolean {
  const perms = ROLE_PERMISSIONS[role];
  const wildcard = perms['*'];
  if (wildcard?.includes(action)) return true;
  return perms[resource]?.includes(action) ?? false;
}

/** Recursos que o perfil pode pelo menos ler — usado para montar a navegação. */
export function readableResources(role: RoleName): Set<Resource> {
  const perms = ROLE_PERMISSIONS[role];
  if (perms['*']) return new Set(ALL_RESOURCES);
  return new Set(
    (Object.keys(perms) as Resource[]).filter((resource) => perms[resource]?.includes('read')),
  );
}
