export type RoleName =
  | 'ADMINISTRADOR'
  | 'FINANCEIRO'
  | 'CONTABILIDADE'
  | 'DIRETORIA'
  | 'VISUALIZADOR';

export type Action = 'read' | 'create' | 'update' | 'delete';

export type Resource =
  | 'dashboard'
  | 'contasAPagar'
  | 'contasAReceber'
  | 'fluxoDeCaixa'
  | 'notasFiscais'
  | 'impostos'
  | 'centrosDeCusto'
  | 'clientes'
  | 'fornecedores'
  | 'relatorios'
  | 'sincronizacoes'
  | 'usuarios'
  | 'auditoria';
