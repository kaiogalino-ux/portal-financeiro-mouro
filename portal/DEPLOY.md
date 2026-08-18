# Publicar o portal

## Arquitetura recomendada

Três peças, cada uma no serviço em que ela é gratuita e sem atrito:

| Peça | Onde | Por quê |
| --- | --- | --- |
| Banco | **Supabase** | Postgres gerenciado, com backup e pooler |
| Site | **Vercel** | Publica sozinho a cada push na `main` |
| Sincronização diária | **Render** (Cron Job) | Sem limite de tempo de execução |

A sincronização fica **fora do Vercel** de propósito. `scripts/sync-diario.ts`
conversa direto com o Postgres e com o Gestão Click — não precisa do servidor web
—, e varre uma janela de 20 anos para trás e 10 à frente
(`SYNC_LOOKBACK_DAYS` / `SYNC_LOOKAHEAD_DAYS`). Isso passa fácil do limite de
função serverless do Vercel (60s no Hobby, 300s no Pro). No Render ela roda como
job de verdade, sem cronômetro.

Se preferir tudo num lugar só, o Render também hospeda o site (o projeto já tem
`Dockerfile` e `output: 'standalone'`). Aí o Vercel sai da jogada.

---

## 1. Supabase — banco

Crie o projeto e pegue **as duas** strings de conexão em *Project Settings →
Database*:

| Variável | Qual string | Porta |
| --- | --- | --- |
| `DATABASE_URL` | Connection pooling (Transaction) | 6543 |
| `DIRECT_URL` | Direct connection | 5432 |

Na `DATABASE_URL`, acrescente `?pgbouncer=true&connection_limit=1`.

Não é preciosismo: serverless abre uma conexão por invocação, e sem pooler o
Postgres esgota o limite. Já as **migrações não rodam através do pooler** em modo
transação — por isso as duas. O `schema.prisma` já está preparado para esse par.

## 2. Migrações e usuários (uma vez só)

Da sua máquina, com as duas variáveis apontando para o Supabase:

```
npx prisma migrate deploy
npm run db:seed
```

São 3 migrações. O seed cria os cinco usuários (um por perfil).
**Troque a senha de cada um** na tela de Usuários depois do primeiro acesso — a
senha do seed é a mesma para todos.

## 3. Vercel — site

Importe o repositório e configure:

- **Root Directory: `portal`** — obrigatório. A raiz do repositório é o projeto de
  integração com o Gestão Click, não o Next.
- Framework: Next.js (detectado sozinho).
- O build já roda `prisma generate`; nada a configurar.

Variáveis de ambiente:

| Variável | Valor |
| --- | --- |
| `DATABASE_URL` | String com pooling (porta 6543) |
| `DIRECT_URL` | String direta (porta 5432) |
| `AUTH_SECRET` | **Gere um novo**: `npx auth secret`. Nunca o de desenvolvimento |
| `AUTH_URL` | A URL publicada |
| `PORTAL_PUBLIC_URL` | A mesma URL publicada |
| `ERP_ADAPTER` | `gestaoclick` |
| `GESTAOCLICK_ACCESS_TOKEN` | Já existe no `.env` local |
| `GESTAOCLICK_SECRET_ACCESS_TOKEN` | Já existe no `.env` local |

`AUTH_URL` e `PORTAL_PUBLIC_URL` só se sabem depois do primeiro deploy: publique,
copie a URL, preencha as duas e publique de novo.

O repositório é **público** — nenhum desses valores pode entrar em arquivo
versionado.

## 4. Render — sincronização diária

Novo **Cron Job** apontando para este repositório:

- Root Directory: `portal`
- Build: `npm ci && npx prisma generate`
- Comando: `npm run sync:diario`
- Agenda: `0 6 * * *` (06:00 todo dia; ajuste ao seu fuso)

Variáveis: `DATABASE_URL`, `DIRECT_URL`, `ERP_ADAPTER`, as duas do Gestão Click e
as duas de janela (`SYNC_LOOKBACK_DAYS`, `SYNC_LOOKAHEAD_DAYS`). Não precisa de
`AUTH_SECRET` — o job não serve HTTP.

Cada execução aparece na tela de Sincronizações do portal, igual às manuais.

---

## Publicar sem sair da máquina não funciona no Windows

`vercel deploy` compila localmente e cria links simbólicos, o que o Windows
bloqueia sem Modo Desenvolvedor (`EPERM: operation not permitted, symlink`).
Não contorne isso: pelo fluxo normal, o Vercel compila nos servidores dele a
partir do GitHub e o problema não existe.
