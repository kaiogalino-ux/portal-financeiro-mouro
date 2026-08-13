import {
  BarChart3, Building2, FileStack, Landmark, LayoutDashboard, ListChecks,
  Receipt, RefreshCw, ScrollText, ShieldCheck, Users, Wallet, Percent, PlugZap,
} from 'lucide-react';
import type { Resource } from '@/shared/types/rbac.types';

export interface NavItem {
  href: string;
  label: string;
  resource: Resource;
  icon: typeof LayoutDashboard;
  /** Ainda sem dados reais nesta entrega — ver README (roadmap). */
  emConstrucao?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Resumo', resource: 'dashboard', icon: LayoutDashboard },
  { href: '/contas-a-pagar', label: 'Contas a Pagar', resource: 'contasAPagar', icon: Wallet },
  { href: '/contas-a-receber', label: 'Contas a Receber', resource: 'contasAReceber', icon: Landmark },
  { href: '/fluxo-de-caixa', label: 'Fluxo de Caixa', resource: 'fluxoDeCaixa', icon: BarChart3, emConstrucao: true },
  { href: '/notas-emitidas', label: 'Notas Emitidas', resource: 'notasFiscais', icon: Receipt, emConstrucao: true },
  { href: '/impostos', label: 'Impostos', resource: 'impostos', icon: Percent, emConstrucao: true },
  { href: '/centros-de-custo', label: 'Centros de Custo', resource: 'centrosDeCusto', icon: FileStack, emConstrucao: true },
  { href: '/clientes', label: 'Clientes', resource: 'clientes', icon: Users },
  { href: '/fornecedores', label: 'Fornecedores', resource: 'fornecedores', icon: Building2 },
  { href: '/relatorios', label: 'Relatórios', resource: 'relatorios', icon: ScrollText, emConstrucao: true },
  { href: '/sincronizacoes', label: 'Sincronizações', resource: 'sincronizacoes', icon: RefreshCw },
  { href: '/integracoes', label: 'Integrações', resource: 'integracoes', icon: PlugZap },
  { href: '/usuarios', label: 'Usuários e Permissões', resource: 'usuarios', icon: ListChecks },
  { href: '/auditoria', label: 'Auditoria', resource: 'auditoria', icon: ShieldCheck },
];
