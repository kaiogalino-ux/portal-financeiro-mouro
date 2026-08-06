/**
 * Descoberta real, empírica, ao ligar o GestaoClickAdapter contra a API de
 * produção: alguns recursos (ex.: `compras`, `formas_pagamentos`) devolvem
 * cada registro embrulhado num objeto com uma única chave no nome do
 * model ("Compra", "FormasPagamento"), enquanto outros (`pagamentos`,
 * `clientes`) já vêm no formato plano. Esta função normaliza os dois casos
 * antes de validar/mapear — só desembrulha quando o registro não tem `id`
 * no nível raiz e tem exatamente uma chave cujo valor tem `id`, então nunca
 * afeta os recursos que já são planos.
 */
export function unwrapErpRecord(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return raw;
  const obj = raw as Record<string, unknown>;
  if ('id' in obj) return obj;

  const keys = Object.keys(obj);
  if (keys.length !== 1) return obj;

  const inner = obj[keys[0]!];
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && 'id' in (inner as Record<string, unknown>)) {
    return inner;
  }
  return obj;
}
