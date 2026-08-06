# Portal Financeiro — Mouro Soluções

Primeira entrega do portal financeiro executivo. Dashboard, autenticação com
RBAC real no servidor, camada de integração com ERP desacoplada — com dois
adaptadores disponíveis, `mock` (dados simulados) e `gestaoclick` (API real
do Gestão Click) — e sincronização com histórico auditável, tudo sobre
PostgreSQL, sem depender do ERP a cada carregamento de página.

> Plano de arquitetura completo (contexto, decisões, premissas):
> `C:\Users\kaio.Pereira\.claude\plans\humming-painting-cosmos.md`

## Stack

TypeScript · Next.js 16 (App Router) · React 19 · PostgreSQL · Prisma ·
Tailwind CSS v4 · Recharts · Zod · Auth.js (NextAuth) v5 · Docker Compose ·
ESLint · Prettier · Vitest.

## Pré-requisitos

- Node.js 20+
- Um PostgreSQL local. Três formas de conseguir um, escolha uma:
  - Docker Compose: `docker compose up -d db` (usa o `docker-compose.yml` deste repo).
  - PostgreSQL nativo (usado nesta máquina, sem Docker disponível):
    `winget install --id PostgreSQL.PostgreSQL.17`, depois crie o role/banco:
    `psql -U postgres -c "CREATE ROLE portal LOGIN PASSWORD 'portal' CREATEDB;"` e
    `psql -U postgres -c "CREATE DATABASE portal_financeiro OWNER portal;"`.
  - Um Postgres já existente em outro lugar — só ajuste `DATABASE_URL`.

## Executando localmente

```bash
cp .env.example .env
# gere um valor para AUTH_SECRET, ex:
npx auth secret

docker compose up -d db      # ou aponte DATABASE_URL para um Postgres existente

npm install
npm run db:generate
npm run db:migrate           # cria as tabelas
npm run db:seed              # cria empresas, usuários e dispara a sincronização simulada

npm run dev                  # http://localhost:3000
```

### Usando dados reais do Gestão Click em vez de simulados

1. No `.env`, defina `ERP_ADAPTER=gestaoclick` e preencha
   `GESTAOCLICK_ACCESS_TOKEN`/`GESTAOCLICK_SECRET_ACCESS_TOKEN`.
2. Em vez de `npm run db:seed` (que cria empresas fictícias), rode
   `npm run db:bootstrap-real` — cria uma `Empresa` local (o CNPJ é só um
   identificador local, ajustável depois; a API não expõe dados cadastrais
   da própria empresa) e dispara a primeira sincronização real.
3. Repita a sincronização quando quiser (botão "Sincronizar agora" em
   Sincronizações, ou de novo via `npm run db:bootstrap-real`).

### Login de demonstração

Todos com a senha `Mouro@2026` (definida em `prisma/seed.ts`):

| E-mail | Perfil |
| --- | --- |
| admin@mourosolucoes.com.br | Administrador |
| Financeiro@mourosolucoes.com.br | Financeiro |
| contabilidade@mourosolucoes.com.br | Contabilidade |
| diretoria@mourosolucoes.com.br | Diretoria |
| visualizador@mourosolucoes.com.br | Visualizador |

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm run start` | build e execução de produção |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | testes unitários (Vitest — não dependem de Postgres) |
| `npm run db:migrate` | aplica migrations do Prisma |
| `npm run db:seed` | popula empresas/usuários e roda a sincronização simulada |
| `npm run db:studio` | Prisma Studio (inspecionar o banco) |

## O que está de fato pronto nesta entrega

- **Login e RBAC real no servidor** (não é só ocultação visual) — 3 camadas:
  `withAuthz` na camada de acesso a dados (a que importa), guarda por rota
  (`requireRole`), e `middleware.ts` como gate grosseiro de sessão.
- **Dashboard executivo**: 8 KPIs com comparação vs mês/ano anterior e
  drill-down (clique no valor abre a lista de títulos que o compõem),
  fluxo de caixa projetado, saldo projetado, principais clientes/fornecedores,
  indicadores de previsão, resultado por centro de custo, filtros globais
  (período, empresa/CNPJ, centro de custo, categoria, regime caixa/competência)
  refletidos na URL, modo de apresentação em tela cheia.
- **Sincronizações**: dispara a sincronização (simulada) manualmente e mostra
  o histórico completo com contagem de criados/atualizados/falhas e log de
  erros por recurso.
- **Contas a Pagar / Contas a Receber / Clientes / Fornecedores**: listagem
  filtrável reaproveitando exatamente as mesmas consultas do dashboard.
- **Usuários e Permissões** (criar/ativar/desativar, só Administrador) e
  **Auditoria** (toda mutação de negócio é registrada).
- **Camada de integração com ERP desacoplada**: interface `ErpAdapter` +
  `MockErpAdapter`, orquestrador com paginação, retry com backoff, validação
  Zod, upsert idempotente por `(empresaId, recurso, id do ERP)`, e staging em
  `ErpRawRecord` para recursos ainda sem mapeamento de campo confirmado.
- **Testes unitários** dos cálculos financeiros que não dependem de banco:
  status de título (`computeTituloStatus`), comparação percentual/deslocamento
  de período, e as particularidades do adaptador simulado.

## O que ainda é placeholder ("em construção" no menu)

Fluxo de Caixa (página dedicada — o gráfico já existe no Resumo), Notas
Emitidas, Impostos, Centros de Custo (cadastro direto) e Relatórios
(exportação). O banco, os repositórios e a autorização já existem para todos
— falta só a tela.

## Decisões técnicas relevantes

- **`Titulo` único para contas a pagar e a receber** (discriminador `tipo`),
  em vez de duas tabelas — no ERP real elas têm exatamente o mesmo formato e
  o fluxo de caixa precisa somar os dois. Status
  (PREVISTO/REALIZADO/VENCIDO/CANCELADO) **nunca é uma coluna armazenada**:
  é calculado a partir de `liquidado` + datas, porque um status gravado
  ficaria desatualizado só com o calendário avançar.
- **Regime de caixa vs. competência nunca são misturados**: todo título
  guarda `dataVencimento`, `dataLiquidacao` e `dataCompetencia`
  separadamente; o filtro de regime só decide qual data é usada para agrupar
  em agregações, nunca altera o status individual do título.
- **NextAuth v5 (Auth.js) ainda em beta** (`5.0.0-beta.32` — não há versão
  estável no momento desta entrega) — escolhido mesmo assim por ser o padrão
  de fato para App Router hoje. Sessão usa estratégia **JWT** (exigência do
  provider Credentials — sessão em banco só existe para contas OAuth), com
  revalidação de `role`/`active` contra o banco a cada requisição no callback
  `jwt`, para que desativar um usuário ou mudar sua role tenha efeito
  imediato mesmo sem sessão em banco.
- **Prisma fixado em 6.x** (não 7, que já é `latest` no momento desta
  entrega) porque `@auth/prisma-adapter` ainda não declara suporte a
  `@prisma/client` 7. **ESLint fixado em 9.x** (não 10) porque
  `eslint-plugin-react`/`eslint-plugin-jsx-a11y`, usados por
  `eslint-config-next`, ainda não suportam a API interna do ESLint 10.
  **TypeScript fixado em 6.x** (não 7, o novo compilador nativo) porque
  `typescript-eslint` ainda não o suporta. Revisitar essas três fixações
  quando o ecossistema atualizar.
- **Sincronização roda dentro do próprio processo Next.js** (server action),
  sem serviço/worker separado — mais simples para esta entrega. Um worker
  dedicado (com fila/agendamento) é o próximo passo natural quando os
  limites reais de taxa do ERP forem conhecidos.
- **Dois adaptadores de ERP** — `MockErpAdapter` (dados simulados, usado na
  primeira entrega) e `GestaoClickAdapter` (API real, adicionado depois a
  pedido, reaproveitando o comportamento já validado em
  `../src/gestaoClickClient.js` na raiz do repo: base URL, headers
  `access-token`/`secret-access-token`, e a particularidade real do filtro
  de data em `pagamentos`/`recebimentos`). Troca-se via `ERP_ADAPTER` no
  `.env` — o orquestrador de sincronização não muda em nenhuma linha.
  Recursos sem mapeamento de campo confirmado contra a API real (`vendas`,
  `orcamentos`, `compras`, `servicos`, `produtos`, `usuarios`) continuam indo
  para `ErpRawRecord` (payload bruto), não para tabelas normalizadas.
- **Todo valor monetário é `Decimal` no Postgres** (`@db.Decimal(14,2)`),
  nunca `Float` — evita erro de arredondamento em valores financeiros reais.

## Descobertas ao ligar a API real do Gestão Click (não estavam em nenhuma doc)

- **A janela de sincronização (`SYNC_LOOKBACK_DAYS`/`SYNC_LOOKAHEAD_DAYS`)
  precisa ser larga, não só "recente"**: para `pagamentos`/`recebimentos`, a
  API filtra títulos em aberto pela data de **vencimento** — uma janela
  curta (ex.: 270 dias atrás) deixa de fora títulos vencidos há muito tempo,
  fazendo "Total a pagar/receber" ficar incompleto (confirmamos isso: com a
  janela curta, "Total a pagar" batia R$ 1.211.640,11; com a janela ampla
  batia R$ 2.335.056,72 — o valor real, verificado somando manualmente os
  411 títulos em aberto trazidos pela API). Os padrões agora são 20 anos
  atrás / 10 anos à frente, para garantir cobertura total.
- **"Total a pagar" e "Total a receber" usam regras de data diferentes uma
  da outra, de propósito, confirmado com o cliente**: Total a pagar soma
  títulos em aberto com vencimento **do passado até hoje** (atrasados + o
  que vence hoje — nunca conta parcela futura que ainda não venceu). Total
  a receber soma títulos em aberto com vencimento **até 1 ano a partir de
  hoje** (atrasados + a vencer nos próximos 12 meses). Por isso os dois
  também não batem com o relatório nativo "Contas a Pagar/Receber" do
  Gestão Click, que por padrão mostra só um período selecionado na tela —
  o tooltip de cada card explica a regra exata para quem for comparar.
- **Alguns recursos embrulham cada registro num objeto com o nome do model**
  (ex.: `compras` vem como `{ "Compra": {...} }`, `formas_pagamentos` como
  `{ "FormasPagamento": {...} }`), enquanto outros (`pagamentos`, `clientes`)
  já vêm no formato plano. `src/server/erp/unwrapErpRecord.ts` normaliza os
  dois casos automaticamente antes de validar/mapear.
- **A listagem de `notas_fiscais` não é acessível via API** para esta conta
  — a API responde 404 com `"Private Action NotasFiscaisController::index()
  is not directly accessible"`. `GestaoClickAdapter` falha rápido e com
  mensagem clara para esse recurso específico, em vez de tentar a cada
  sincronização; o indicador "Faturamento do mês" fica sem dados reais até
  a Gestão Click confirmar outro caminho (ex.: nota por nota) para isso.
- Rodando contra a conta real: 2313 registros criados/atualizados sem
  nenhuma falha de registro (`clientes`, `fornecedores`, `transportadoras`,
  `formas_pagamentos`, `contas_bancarias`, `pagamentos`, `recebimentos`) —
  só `notas_fiscais` falha, pelo motivo acima, e a sincronização mostra isso
  claramente como "Parcial" em vez de mascarar o problema.

## Avisos conhecidos

- O build de produção (`next build`) emite avisos do Turbopack sobre
  "dynamic filesystem access" dentro do runtime do Prisma — é um aviso
  conhecido do Prisma com `output: 'standalone'`, não impede o build nem a
  execução; só amplia o que é rastreado para o bundle final.
- `package.json#prisma.seed` está deprecado a partir do Prisma 7 (usamos
  6.x) — migrar para `prisma.config.ts` é um housekeeping futuro, não
  urgente.
