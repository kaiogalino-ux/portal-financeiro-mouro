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

Todos são criados com a senha definida em `SEED_PASSWORD` no `.env` — que
nunca é versionado, porque este repositório é público e senha em texto no
código vira senha publicada. Sem essa variável, `db:seed` e
`db:bootstrap-real` falham de propósito. Depois do primeiro login, troque a
senha de cada usuário pela tela de Usuários.

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
| `npm run sync:diario` | dispara a sincronização (trigger `AGENDADO`) — pensado pra rodar via agendador do SO, não manualmente |
| `npm run mcp` | servidor MCP do portal (stdio) — consome a própria API v1; ver "Integrações" |

### Sincronização diária automática

A sincronização com o Gestão Click não roda por conta própria — precisa de
um agendador do sistema operacional chamando `npm run sync:diario`
periodicamente. Nesta máquina (Windows), isso está configurado como uma
tarefa agendada (`schtasks`) chamando `sync-diario.cmd` todos os dias às
07:00, com log em `sync-diario.log` (ambos na raiz de `portal/`, fora do
controle de versão). Para inspecionar/alterar o horário:
`schtasks /Query /TN "PortalFinanceiro_SyncDiaria" /V /FO LIST` ou o painel
"Agendador de Tarefas" do Windows.

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

## Integrações (API pública + MCP)

A página **Integrações** (só Administrador) gera chaves de API que permitem
conectar o portal a outros aplicativos.

**Modelo de acesso.** Cada chave carrega um perfil (`Role`) e passa pela
**mesma matriz RBAC dos usuários** — uma chave `FINANCEIRO` enxerga
exatamente o que um usuário `FINANCEIRO` enxergaria. Isso é conseguido sem
duplicar nenhuma query: as rotas `/api/v1` rodam o handler dentro de
`runAsApiActor` (`server/integracoes/apiActorContext.ts`, AsyncLocalStorage),
e `withAuthz` — a única linha que de fato autoriza no servidor — reconhece
esse ator e aplica `can()` normalmente. Todos os repositórios existentes
funcionam pela API sem alteração.

**Armazenamento do token.** Só o SHA-256 fica no banco (`ApiKey.tokenHash`);
o token em claro existe uma única vez, no retorno da criação. `prefixo`
guarda um trecho curto só para o usuário reconhecer a chave na tela. Como o
token é aleatório de 256 bits, SHA-256 basta — bcrypt só penalizaria cada
requisição sem ganho real. Revogar é irreversível de propósito.

**Escopo.** Leitura de tudo que o perfil alcança, mais um único comando de
escrita: `POST /api/v1/sincronizacoes`, que não altera nada no ERP — apenas
atualiza a cópia local. Sincronização disparada assim é registrada com
trigger `API` e auditada com `actorType: API`, para a trilha não confundir
uma ação de robô com uma ação humana.

### Endpoints

Todos exigem `Authorization: Bearer <chave>`, exceto `openapi.json`.

| Endpoint | O que faz |
| --- | --- |
| `GET /api/v1/me` | valida a chave e lista os recursos que ela alcança (use ao diagnosticar) |
| `GET /api/v1/kpis` | todos os indicadores, cada um com `label` e a regra de cálculo |
| `GET /api/v1/kpis/{indicador}` | um indicador; com `?detalhe=true`, os títulos que o compõem |
| `GET /api/v1/contas-a-pagar` · `/contas-a-receber` | títulos, com os mesmos filtros do dashboard |
| `GET /api/v1/clientes` · `/fornecedores` | cadastros, com `?busca=` |
| `GET /api/v1/sincronizacoes` | histórico (mostra o quão atuais são os dados) |
| `POST /api/v1/sincronizacoes` | dispara a sincronização (~1 min; exige Administrador ou Financeiro) |
| `GET /api/v1/openapi.json` | especificação OpenAPI 3.1 — sem autenticação, é só a descrição da interface |

As respostas de indicador incluem `descricao` (a regra de data exata do
cálculo) porque o consumidor costuma ser um LLM: o número sem a regra que o
define é convite a interpretação errada.

### Conectando cada canal

- **Claude (Desktop/Code)** — funciona já, local, sem publicar nada.
  `npm run mcp` roda `mcp/portalFinanceiroMcp.mjs` via stdio, e ele consome
  a própria API v1 (nunca o banco direto, para não criar um caminho de
  acesso paralelo às regras da API). Configure com `PORTAL_API_URL` e
  `PORTAL_API_TOKEN`; a página Integrações mostra o JSON pronto.
- **ChatGPT (GPT Actions)** — importe `/api/v1/openapi.json` e escolha
  autenticação Bearer.
- **Telegram/WhatsApp** — não consomem API direto: precisam de um bot
  intermediário (BotFather / API oficial da Meta ou Twilio) que chame a
  API v1.

**Os três últimos exigem o portal publicado com HTTPS** — chamam de fora e
não alcançam `localhost`. Defina `PORTAL_PUBLIC_URL` quando publicar.

## Recorte global dos dados (vale para TODO indicador, gráfico e listagem)

Aplicado num único lugar — `buildTituloWhere` em
`src/server/dashboard/filters.ts` — e por isso automaticamente válido em
todos os KPIs, gráficos, drill-downs, páginas de Contas a Pagar/Receber e
na API pública. Dois filtros, ambos confirmados com o cliente:

1. **Somente a conta bancária `Bradesco`.** Outras contas do cadastro
   (`Conta Claudio`, `Conta bancária`) nunca entram em número nenhum.
2. **Somente as formas de pagamento `Boleto Bancário`, `PIX` e
   `Transferência Bancária`** — as que de fato movimentam a conta. É uma
   lista de **permissão**, não de bloqueio: forma nova cadastrada no ERP
   fica de fora até ser avaliada, em vez de entrar sozinha nos números.

O item 2 não é só para espelhar o relatório nativo do Gestão Click (que
aplica exatamente este recorte) — é para **não contar o mesmo gasto duas
vezes**: uma compra no cartão de crédito é lançada como título próprio *e*
reaparece na fatura do cartão, essa sim paga por boleto saindo do Bradesco.
Em jan–jul/2026 eram 16 compras no cartão + 1 em dinheiro, R$ 23.907,62 de
dupla contagem — era exatamente a diferença contra o relatório do ERP.

**Ao revisar:** `Cartão de Débito` e `Cheque` existem no cadastro do ERP e
movimentam a conta, mas hoje nenhum título os usa. Se passarem a ser
usados, precisam entrar na lista, senão os totais ficam subestimados.

## Como definir/ajustar um total (KPI) financeiro em aberto

Todo KPI de "em aberto" (`totalAPagar`, `totalAReceber`, `titulosVencidos`,
`saldoProjetado` — qualquer soma sobre `Titulo` com `liquidado: false`)
segue sempre este processo, não só na entrega inicial:

1. **A regra de data é sempre específica do KPI, nunca genérica** — cada
   card pode ter seu próprio recorte (ex.: `totalAPagar` só conta
   01/12/2025 → fim do mês vigente; `totalAReceber` só conta a partir de
   01/01/2026, sem teto de fim). A regra vem do cliente, não de uma
   convenção técnica — perguntar antes de assumir, e assumir explicitamente
   se o corte tem início fixo, fim fixo, os dois, ou nenhum.
2. **Sempre filtrar `canceladoEm: null`** junto com `liquidado: false` — um
   título excluído na origem (ver `reconciliarTitulosRemovidos` em
   `orchestrator.ts`) fica marcado `CANCELADO` localmente e nunca deve
   entrar em nenhuma soma de "em aberto".
3. **A mesma condição `where` alimenta a soma do card (`kpis.ts`
   `KPI_DEFINITIONS`) e o drill-down (`detailWhereFor`)** — nunca duas
   implementações da mesma regra; o total do card tem que ser sempre
   exatamente a soma da lista que abre ao clicar nele.
4. **Documentar a regra em texto simples em dois lugares**: o tooltip do
   card (`KPI_HELP` em `dashboard.types.ts`) e este README (seção acima,
   "Descobertas...") — quem for comparar com o relatório nativo da Gestão
   Click precisa conseguir ler a regra exata sem abrir código.
5. **Validar rodando uma sincronização e comparando com o relatório nativo
   da Gestão Click** (mesmo filtro de data e situação "Em Aberto") — nunca
   assumir que bate só porque o código parece certo. Se não bater
   exatamente, investigar até achar a causa raiz específica (não parar em
   "deve ser só sincronização desatualizada") — casos reais encontrados
   nesta entrega: título excluído na origem que a sincronização nunca
   limpava localmente (corrigido com a reconciliação), e um título
   liquidado na Gestão Click nos minutos entre uma sincronização e a
   comparação (não é bug — é só rodar a sincronização de novo).

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
- **"Total a pagar" e "Total a receber" usam regras diferentes uma da
  outra, de propósito, confirmado com o cliente**: Total a pagar soma
  títulos em aberto com vencimento **entre 01/12/2025 e o fim do mês
  vigente** (não conta vencimento anterior a dez/2025 nem posterior ao mês
  atual). Total a receber soma títulos em aberto com vencimento **a partir
  de 01/01/2026, sem limite de fim** (corta legado anterior a 2026, mas
  conta tudo em aberto dali pra frente, mesmo muito no futuro). O tooltip
  de cada card explica a regra exata para quem for comparar.
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
- **A sincronização só fazia upsert — nunca soube remover localmente um
  título excluído na origem** (achado ao investigar por que "Total a pagar"
  não batia com o relatório nativo do Gestão Click mesmo logo depois de
  sincronizar: 4 títulos "fantasma", excluídos no ERP, continuavam contando
  como em aberto no banco local pra sempre, porque o upsert só atualiza o
  que a API ainda devolve — nunca reconcilia o que sumiu). Corrigido no
  orquestrador (`reconciliarTitulosRemovidos` em `orchestrator.ts`): ao
  final de sincronizar `pagamentos`/`recebimentos`, todo título local ainda
  em aberto dentro da janela pesquisada cujo `erpId` não veio na resposta é
  marcado como `CANCELADO` (nunca apagado, preserva auditoria). Os KPIs de
  "em aberto" (`totalAPagar`, `totalAReceber`, `titulosVencidos`,
  `saldoProjetado`) agora excluem `canceladoEm` explicitamente.
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
