# Mouro Soluções — Integração Gestão Click

Este repositório tem duas partes:

## 1. Toolkit de integração (raiz)

Cliente Node.js validado contra a API real do Gestão Click (Betel
Tecnologia), servidor MCP para consultar/alterar dados do ERP direto de uma
conversa com o Claude, e um script de relatório de contas a pagar.

- [`src/gestaoClickClient.js`](src/gestaoClickClient.js) — cliente HTTP (auth, paginação, CRUD genérico)
- [`src/mcpServer.js`](src/mcpServer.js) — servidor MCP (ferramentas `gestaoclick_list/get/create/update/delete`)
- [`scripts/relatorio-contas-a-pagar.js`](scripts/relatorio-contas-a-pagar.js) — gera relatório `.xlsx` de contas a pagar em aberto
- [`examples/`](examples/) — exemplos de uso do cliente

Configuração: copie `.env.example` para `.env` e preencha
`GESTAOCLICK_ACCESS_TOKEN`/`GESTAOCLICK_SECRET_ACCESS_TOKEN` (gerados em
Configurações > API no painel do Gestão Click).

## 2. Portal Financeiro (`portal/`)

Aplicação web completa (Next.js + PostgreSQL + Prisma) — dashboard
executivo, autenticação com RBAC, sincronização com o ERP e histórico
auditável. Documentação completa, decisões técnicas e como rodar
localmente: [`portal/README.md`](portal/README.md).

## Segurança

Nenhuma credencial real está neste repositório — `.env` (raiz e `portal/`)
está no `.gitignore`. Relatórios gerados (`relatorios/`) contêm dados
financeiros reais da empresa e também são ignorados pelo git de propósito.
