# Publicar o portal

## Antes de escolher a plataforma

O portal precisa de três coisas para funcionar de verdade:

1. **Um PostgreSQL** — todos os dados do portal vivem nele. O `docker-compose.yml`
   sobe um só para desenvolvimento; em produção ele precisa de um banco de verdade,
   com backup.
2. **A sincronização diária com o Gestão Click** (`npm run sync:diario`) — é o que
   mantém os números atualizados. Sem ela o portal congela no último sync.
3. **Migrações aplicadas** (`npx prisma migrate deploy`) a cada release que mexa no
   schema.

O item 2 é o que decide a plataforma. A sincronização varre uma janela de 20 anos
para trás e 10 à frente (`SYNC_LOOKBACK_DAYS` / `SYNC_LOOKAHEAD_DAYS`) e pode levar
minutos.

## Vercel

Funciona, com ressalvas. Passos:

### 1. Banco de dados (fora do Vercel)

Vercel não hospeda banco. Crie um Postgres em Neon, Supabase ou Vercel Postgres.
**Use a string de conexão com pooling** (`-pooler` no host, no caso do Neon):
serverless abre uma conexão por invocação e um Postgres sem pooler esgota o limite
rápido.

### 2. Importar o repositório

- **Root Directory: `portal`** — obrigatório. A raiz do repositório é o projeto de
  integração com o Gestão Click, não o Next.
- Framework: Next.js (detectado sozinho).
- O build já roda `prisma generate` (ver `package.json`); não precisa configurar nada.

### 3. Variáveis de ambiente

Copie de `.env.example`. As obrigatórias:

| Variável | Observação |
| --- | --- |
| `DATABASE_URL` | String **com pooling** do provedor escolhido |
| `AUTH_SECRET` | Gere um novo com `npx auth secret` — **não reaproveite o de desenvolvimento** |
| `AUTH_URL` | A URL publicada (ex.: `https://seu-app.vercel.app`) |
| `ERP_ADAPTER` | `gestaoclick` para dados reais |
| `GESTAOCLICK_ACCESS_TOKEN` | Credencial do ERP |
| `GESTAOCLICK_SECRET_ACCESS_TOKEN` | Credencial do ERP |
| `SEED_PASSWORD` | Só para criar os usuários iniciais |
| `PORTAL_PUBLIC_URL` | Mesma URL publicada |

O repositório é **público** — nenhum desses valores pode entrar em arquivo versionado.

### 4. Migrações e usuários (uma vez)

Rode da sua máquina, apontando `DATABASE_URL` para o banco de produção:

```
npx prisma migrate deploy
npm run db:seed          # ou db:bootstrap-real
```

Depois **troque a senha de cada usuário** pela tela de Usuários. A senha do seed é
a mesma para todos e serve só para o primeiro acesso.

### 5. Sincronização diária

Vercel não roda scripts de terminal agendados. Seria preciso:

- expor a sincronização como rota de API protegida,
- agendar com Vercel Cron,
- e caber no **limite de tempo da função** (60s no plano Hobby, até 300s no Pro).

**É aqui que costuma quebrar.** A sincronização completa pode passar disso. Se
passar, as opções são: reduzir a janela de dias, quebrar o sync em lotes, ou rodar
o sync fora do Vercel (uma máquina qualquer com `cron` chamando a rota).

## Alternativa: container

O projeto já tem `Dockerfile` e `output: 'standalone'` no `next.config.ts` — foi
desenhado para container. Railway, Render ou uma VPS hospedam **o app e o Postgres
juntos** e rodam a sincronização como job agendado de verdade, sem limite de
tempo e sem precisar reescrever nada.

Se a sincronização diária for essencial (e é: sem ela os números param no tempo),
essa via costuma dar menos trabalho que o Vercel.
