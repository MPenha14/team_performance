# Media Performance

Sistema web de acompanhamento de performance dos colaboradores da equipe de
**Mídias e Call Center da Mais Saúde**, com integração direta à API do
**Dr.Click**.

A API do Dr.Click é a **fonte oficial dos dados**. O sistema nunca recalcula,
substitui ou estima valores que a API já retorna (`schedules.cons`,
`schedules.exam`, `schedules.proc`, `schedules.ret`, `patients`, `newPatients`,
`revenue`, `combos`, etc.) — esses números são exibidos exatamente como
recebidos.

## Arquitetura

```
/backend   Node.js + TypeScript + Express + Prisma (proxy seguro para o Dr.Click)
/frontend  React + TypeScript + Vite + Tailwind CSS + Recharts
```

O frontend **nunca** acessa a API do Dr.Click diretamente nem tem acesso ao
token. Todas as chamadas passam pelo backend, que injeta as credenciais via
variáveis de ambiente.

```
Frontend (React)  →  Backend (Express)  →  API Dr.Click
                          ↓
                     PostgreSQL (colaboradores, mapeamento, histórico, cache)
```

### Estrutura de pastas

```
backend/src/
  controllers/     Handlers das rotas HTTP
  services/        Regras de negócio (performance, schedules, sync, historico,
                    colaboradores, mapeamento)
  routes/          Definição das rotas /api/*
  middleware/      Tratamento de erros, async handler
  integrations/    Cliente HTTP do Dr.Click (única camada com o token)
  jobs/            Agendador de sincronização automática (node-cron)
  types/           Tipos que espelham o retorno da API do Dr.Click
  utils/           Prisma client, logger, cache em memória, helpers

frontend/src/
  components/      Componentes reutilizáveis (KpiCard, StatusBadge, FilterBar,
                    EmployeeFormModal...)
  pages/           Telas (Dashboard, Ranking, Colaboradores, DrClickIntegration,
                    Agendamentos...)
  hooks/           React Query hooks + contexto de filtros globais
  services/        Cliente Axios para o backend interno
  types/           Tipos que espelham o retorno da API (via backend)
  charts/          Gráficos (Recharts)
  layouts/         MainLayout (sidebar) e modo TV
  providers/       FiltersProvider (filtros globais compartilhados)
  utils/           Formatação, exportação CSV, estilos de status
```

## 1. Como instalar

Pré-requisitos: **Node.js 18+**, **PostgreSQL 14+** (local ou remoto).
Docker não é utilizado neste projeto.

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2. Como configurar o `.env`

### Backend (`backend/.env`)

Copie o exemplo e preencha com os valores reais:

```bash
cd backend
cp .env.example .env
```

```env
PORT=3333
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL="postgresql://usuario:senha@localhost:5432/media_performance?schema=public"

DRCLICK_API_URL=https://api-maissaude.drclick.com.br
DRCLICK_TOKEN=COLOCAR_TOKEN_AQUI
DRCLICK_AUTHORIZATION=COLOCAR_AUTHORIZATION_AQUI

DRCLICK_CLINIC_IDS=12706efb-9be9-47d6-a997-7a910c57ef4a,3d55137b-221b-4e98-bf8f-802f49848bbf,3fe2145e-ec64-442b-a967-864afb4d4393,4789e97d-c710-4a83-ab03-66e9a9a55428,801b69e2-eb43-4292-80ba-77c8416d9757,8e0f9a74-ab0e-421d-a037-720ffc1392b7,960d2a28-b716-481c-951f-8b9a5bf1feec,b9b196f3-122f-4eb6-80d1-629d9ff37838,bf7f6157-8775-4766-be38-8aa34ec07070,d0ed8f70-2502-4173-9d0f-71fd45f28ee7

SYNC_CRON_ENABLED=true
SYNC_CRON_EXPRESSION=*/15 * * * *

ADMIN_EMAIL=admin@clinica.com
ADMIN_PASSWORD=admin123
JWT_SECRET=COLOCAR_UM_SEGREDO_ALEATORIO_AQUI
```

> **IMPORTANTE:** `DRCLICK_TOKEN`/`DRCLICK_AUTHORIZATION`/`JWT_SECRET`/
> `ADMIN_PASSWORD` nunca devem ir para o frontend, nem ser commitados. O
> `.env` já está no `.gitignore`. Gere um `JWT_SECRET` próprio em produção
> (ex.: `openssl rand -hex 48`) — não reaproveite o valor de exemplo.

### Frontend (`frontend/.env`)

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3333/api
```

O frontend só conhece a URL do **backend interno** — nunca a URL nem o token
do Dr.Click.

## 3. Login (autenticação)

O sistema exige login para acessar qualquer tela. As credenciais são fixas
(um único usuário administrador), configuradas via `ADMIN_EMAIL` e
`ADMIN_PASSWORD` no `backend/.env` — por padrão:

- **E-mail:** `admin@clinica.com`
- **Senha:** `admin123`

Como funciona:

- `POST /api/auth/login` recebe `{ email, senha }`, compara com
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` (comparação em tempo constante, via
  `crypto.timingSafeEqual`, para não vazar por timing) e retorna um token
  JWT válido por 12h (assinado com `JWT_SECRET`).
- Esse é o **único** endpoint público — todas as outras rotas em `/api/*`
  (exceto `/health`) exigem o header `Authorization: Bearer <token>`,
  verificado pelo middleware `requireAuth` (`middleware/auth.middleware.ts`).
- O frontend guarda o token no `localStorage` do navegador e o anexa
  automaticamente em toda chamada (`services/api.ts`). Se o backend
  responder 401 (token ausente/expirado), o frontend limpa o token e
  redireciona para `/login`.
- Não há cadastro de múltiplos usuários nem recuperação de senha — é um
  único login administrativo, adequado ao uso interno da equipe. Para
  trocar a senha, basta alterar `ADMIN_PASSWORD` no `.env` e reiniciar o
  backend.

## 4. Como configurar o PostgreSQL

Crie o banco (localmente ou em um serviço gerenciado, como Railway) garantindo
encoding **UTF8** (nomes com acentos vêm diretamente da API do Dr.Click):

```sql
CREATE DATABASE media_performance WITH ENCODING 'UTF8';
```

Ajuste `DATABASE_URL` no `backend/.env` com usuário, senha, host, porta e
nome do banco corretos.

## 5. Como executar o Prisma

```bash
cd backend

# Gera o Prisma Client a partir do schema
npm run prisma:generate

# Cria/atualiza as tabelas no banco (ambiente de desenvolvimento)
npm run prisma:migrate

# Em produção, use apenas:
npm run prisma:deploy

# Para inspecionar os dados visualmente:
npm run prisma:studio
```

Tabelas criadas: `employees`, `drclick_mappings`, `users`, `clinics`,
`performance_snapshots`, `schedule_records`, `service_channels`,
`service_origins`, `sync_logs`, `daily_metrics` (cache de dias já
sincronizados, ver seção 14).

## 6. Como executar o backend

```bash
cd backend
npm run dev
```

O servidor sobe em `http://localhost:3333`. Endpoints internos disponíveis
em `/api/*` (ver seção 10).

## 7. Como executar o frontend

```bash
cd frontend
npm run dev
```

A aplicação abre em `http://localhost:5173`.

## 8. Cadastro de colaboradores e mapeamento com o Dr.Click

A API do Dr.Click não possui um cadastro fixo de colaboradores — cada consulta
a `/api/reports/schedulesofday` retorna um `roleStatement` com todos os
`user_id` que tiveram atividade no período, incluindo contas que não são
pessoas reais (ex.: `CHATBOT`, `Agendamento Web`, `Aplicativo`). Por isso o
sistema mantém um **cadastro próprio de colaboradores**, independente da API,
e um **mapeamento** que vincula cada colaborador cadastrado às contas
(`user_id`) que ele usa no Dr.Click.

Fluxo de uso:

1. Acesse **Colaboradores** no menu lateral e clique em **+ Adicionar
   colaborador** para cadastrar nome, cargo, data de admissão, e-mail,
   telefone e foto/avatar (URL) — igual a um cadastro de RH, independente do
   Dr.Click.
2. Acesse o menu **Dr.Click** → aba **Mapeamento de Colaboradores**. A tabela
   lista todos os colaboradores cadastrados, um por linha, cada um com um
   seletor "Usuário Dr.Click" contendo todas as contas retornadas pela API no
   período/clínicas selecionados nos filtros do topo. Escolha a conta
   correspondente — o vínculo é salvo automaticamente ao selecionar.
   - O botão **Auto-mapear por nome** tenta vincular automaticamente todos os
     colaboradores ainda sem conta, comparando o nome cadastrado com o nome
     retornado pela API (só mapeia quando há exatamente uma correspondência,
     para evitar ambiguidade).
   - A aba **Configuração** mostra o status da conexão e permite disparar uma
     sincronização manual por data. A aba **Logs de Sincronização** mostra o
     histórico de execuções (automáticas e manuais).
3. A partir do mapeamento, o Dashboard, o Ranking e a Performance Individual
   desse colaborador passam a somar os valores retornados pela API para todas
   as contas mapeadas a ele (sem alterar nenhum valor individual — apenas
   somando registros que já vieram exatamente como a API retornou).

Colaboradores sem nenhuma conta mapeada aparecem com indicadores zerados e um
aviso "Nenhuma conta do Dr.Click mapeada" até que o vínculo seja feito. O
Dashboard, Ranking e Colaboradores só exibem colaboradores cadastrados e
mapeados — contas de bots/sistema do Dr.Click (`CHATBOT`, `Agendamento Web`,
`Aplicativo`, etc.) nunca aparecem como "colaborador", pois nunca são
cadastradas manualmente.

## 9. Como sincronizar os dados

Existem três formas de sincronizar o histórico com o Dr.Click:

1. **Automática**: a cada 15 minutos (configurável via
   `SYNC_CRON_EXPRESSION`), o backend sincroniza o dia atual.
2. **Botão "Sincronizar agora"**: disponível no Dashboard, dispara
   `POST /api/sync` para o período/clínicas selecionados nos filtros.
3. **Manual via API**:

   ```bash
   curl -X POST http://localhost:3333/api/sync \
     -H "Content-Type: application/json" \
     -d '{"start_date":"2026-08-18","end_date":"2026-08-18"}'
   ```

A sincronização usa `upsert` com chaves únicas (`user_id` + período,
paciente + data + serviço + profissional, etc.) para nunca duplicar
registros.

## 10. Endpoints internos da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/health` | Status do backend, banco e configuração (público, sem login) |
| POST | `/api/auth/login` | Login (`{ email, password }` → `{ token }`), único endpoint público além de `/health` — ver seção 3 |
| GET | `/api/dashboard` | Resumo do Dashboard, somando os colaboradores cadastrados/ativos (ver seção 13) |
| GET | `/api/performance` | Performance de todos os colaboradores cadastrados/mapeados (filtros: `start_date`, `end_date`, `idclinica`, `role`, `employee_id`) |
| GET | `/api/performance/:employeeId` | Performance individual de um colaborador (soma as contas mapeadas) |
| GET | `/api/performance/:employeeId/history` | Histórico (evolução) a partir dos snapshots sincronizados |
| GET | `/api/schedules` | Detalhamento de agendamentos (`data.statement`), com busca/filtro/ordenação/paginação |
| GET | `/api/users` | Usuários brutos retornados pela API do Dr.Click no período (sem cadastro) |
| GET | `/api/clinics` | Clínicas configuradas |
| POST | `/api/sync` | Dispara sincronização manual (`start_date`, `end_date`, `clinic_ids` opcional) |
| GET | `/api/sync/logs` | Histórico de execuções de sincronização (`limit` opcional) |
| GET | `/api/employees` | Lista colaboradores cadastrados |
| POST | `/api/employees` | Cadastra um colaborador |
| GET/PUT/DELETE | `/api/employees/:id` | Consulta/edita/remove um colaborador |
| PUT | `/api/employees/:id/mapping` | Define ou remove (`drclickUserId: null`) o vínculo do colaborador com uma conta Dr.Click |
| GET | `/api/mappings` | Lista os mapeamentos colaborador ↔ conta Dr.Click |
| DELETE | `/api/mappings/:id` | Remove um mapeamento |
| POST | `/api/mappings/auto-map` | Mapeia automaticamente colaboradores sem conta, casando por nome exato |

O frontend consome exclusivamente esses endpoints — nunca a API do Dr.Click
diretamente.

## 11. Modo TV / Fullscreen

Acessível em `/tv` (ou pelo botão "Modo TV" no topo do dashboard). Layout sem
sidebar, cards e fontes ampliadas, atualização automática a cada 15 minutos e
suporte a tela cheia do navegador — pensado para exibição em televisões
corporativas.

## 12. Exportação de relatórios

Na tela **Relatórios**, é possível exportar em CSV (compatível com Excel):

- Performance por colaborador (pacientes, novos pacientes, consultas,
  exames, procedimentos, retornos, total de agendamentos, combos,
  faturamento).
- Detalhamento completo de agendamentos do período selecionado.

## 13. Regra de ouro dos dados

- Os valores de `schedules.cons/exam/proc/ret`, `patients`, `newPatients`,
  `revenue`, `combos` etc. são exibidos **exatamente** como retornados pela
  API do Dr.Click.
- O "Total de agendamentos" exibido é uma soma de exibição
  (`cons + exam + proc + ret`) — nunca substitui os valores individuais.
- Quando um colaborador tem mais de uma conta mapeada no Dr.Click, os
  indicadores são a **soma** dos valores de cada conta — nunca um recálculo
  ou estimativa.
- O array `statement` é usado apenas para detalhamento; os totais de
  `schedules` nunca são recalculados a partir dele.
- Status são exibidos com o texto original da API (`statusText`/`status`);
  status desconhecidos aparecem com o texto original, sem invenção.

### Duas fontes de dados, duas bases de data diferentes

A tela **Performance** (`/performance`) combina dois endpoints do Dr.Click
que contam agendamentos de formas diferentes, de propósito:

- **`/api/reports/schedulesofday`** (usado em todo o resto do sistema) conta
  agendamentos por **data de criação/movimentação** — é a fonte de
  `Total de Agendamentos`.
- **`/api/reports/appointmentbystatus`** conta por **data do agendamento
  marcado** (`scheduleDate`) — é a fonte de `Agendamentos Atendidos`, porque
  um paciente costuma ser agendado dias antes e só é atendido na data
  marcada, não na data de criação.

Por isso os dois números vêm de contagens com bases diferentes (nunca
misturamos os dois endpoints para calcular o mesmo indicador) e a
**Conversão** (`atendidos ÷ total × 100`) é uma combinação intencional
dessas duas métricas, não um recálculo de nenhuma delas. Quando um
colaborador não tem nenhum agendamento criado no período (`Total = 0`), a
conversão é exibida como `—` em vez de `0%`, que seria enganoso.

### Sistema restrito aos colaboradores cadastrados (filtro por pessoa, não por canal)

Este sistema mostra os indicadores de **exatamente** os colaboradores
cadastrados e ativos no Media Performance (equipe de Mídias/Call Center) —
nem mais, nem menos. A forma como isso é obtido mudou ao longo do projeto:

- **Antes:** filtrava a API pelo canal de atendimento **Telefonia**
  (parâmetro `idcanalatendimento`). Rápido, mas impreciso: um colaborador
  com algum agendamento fora do canal Telefonia (comum em quem também faz
  Supervisão) ficava com o total um pouco abaixo do que o Dr.Click mostra
  para ele.
- **Atual:** o `/api/reports/schedulesofday` aceita um parâmetro **`user`**
  (não documentado oficialmente, mas confirmado em uso real) que filtra a
  resposta inteira para **um colaborador especifico, em todos os canais**.
  O `/api/reports/appointmentbystatus` já aceitava o equivalente
  (`idusuario`) desde o início. Dashboard, Performance, Ranking e
  Colaboradores agora fazem **uma chamada por colaborador cadastrado**
  (mapeamentos ativos), em paralelo (`runWithConcurrency`, limite de 8 por
  vez), e somam os totais — isso bate **exatamente** com o que o Dr.Click
  mostra para cada pessoa, porque não depende de como o Dr.Click classificou
  o canal daquele agendamento.

Por isso os filtros de **Clínica** e **Cargo/equipe** foram removidos da
interface: o escopo agora é sempre "os colaboradores cadastrados no
sistema", não um canal ou cargo específico do Dr.Click.

Essa troca (canal → por colaborador) foi feita porque tentamos simplesmente
remover o filtro de canal e usar a clínica inteira sem filtro nenhum — isso
**trava** (`/schedulesofday` sem filtro passa de 9MB/dia; testado
`/appointmentbystatus` sem `idcanalatendimento` **nem** `idusuario` para
toda a clínica: timeout de 120s num período de 25 dias, porque a API
precisa agregar todo mundo da clínica). Filtrar por colaborador resolve os
dois problemas ao mesmo tempo: payload pequeno (rápido) **e** preciso (bate
com o Dr.Click), porque cada chamada já é escopada no servidor.

`/api/reports/appointmentbystatus?idusuario=X` (sem canal) também retorna
`services_by_status` com `amount_bill_forecast` (faturamento previsto) por
status — usado para as linhas de "Faturamento" nos cards de Faltosos/
Cancelados e no card de Faturamento dos Atendidos do Dashboard.

**Endpoints que ainda usam o filtro de canal Telefonia** (não por
colaborador): a listagem de **Agendamentos/Relatórios** (`schedule.service.ts`),
a aba **Dr.Click → Mapeamento** e `/api/users` (`mapping.service.ts`,
`users.service.ts`) e a **sincronização** (`sync.service.ts`) continuam
usando `getSchedulesOfDay` com `idcanalatendimento` (configurado em
`DRCLICK_TELEFONIA_CHANNEL_ID` no `backend/.env`) — essas telas precisam
enxergar além dos colaboradores já cadastrados (para poder listar/mapear
gente nova, ou exportar tudo do canal), então o filtro por colaborador não
se aplica a elas.

## 14. Tratamento de erros

O backend traduz erros da API do Dr.Click em mensagens amigáveis (sem nunca
expor o token): autenticação (401/403), indisponibilidade, timeout, respostas
vazias e erros de banco de dados retornam mensagens como *"Não foi possível
consultar os dados do Dr.Click. Tente novamente."*

### Desempenho: chamadas por colaborador, em paralelo, com cache

Dashboard, Performance, Ranking e Colaboradores buscam os dados sempre ao
vivo, com **uma chamada por colaborador cadastrado** (ver seção acima),
disparadas em paralelo (limite de 8 simultâneas) e cacheadas em memória por
5 minutos, por colaborador+período+clínicas — a segunda consulta ao mesmo
período fica quase instantânea. Números medidos num ambiente real (21
colaboradores cadastrados, período de 25 dias):

- `/api/performance`: ~7s na primeira consulta (cache frio), <1s nas
  seguintes.
- `/api/dashboard`: ~1-2s na primeira consulta, <0.5s nas seguintes
  (reaproveita o mesmo cache por colaborador que `/api/performance` já
  aqueceu).

- O timeout do backend para a API do Dr.Click é de 120s (`drclick.client.ts`)
  e o do frontend para o backend é de 130s (`services/api.ts`) — cada
  chamada individual (por colaborador) fica bem abaixo disso mesmo em
  períodos longos, porque o payload é pequeno (só os registros daquele
  colaborador).

O cache persistente em banco (`daily_metrics` + `performance_snapshots`,
alimentado por `POST /api/sync`) **não é usado** para servir Dashboard/
Performance/Ranking/Colaboradores — esses dias foram sincronizados com uma
lógica antiga (clínica/canal inteiro) e não têm a granularidade por
colaborador que o sistema usa hoje. O sync/`daily_metrics` continua
existindo e sendo alimentado, usado apenas pela aba **Dr.Click → Logs de
Sincronização** e pelo histórico de evolução
(`/api/performance/:id/history`, `performance_snapshots`).

## 15. Como fazer deploy

**Deploy atual em produção:**

- Frontend (Vercel): https://team-performance-sable.vercel.app
- Backend (Railway): https://backend-production-69d9.up.railway.app
- Projeto Railway: `impartial-optimism` (mesmo projeto que já hospedava o
  Postgres usado em desenvolvimento — os dados/histórico sincronizados
  foram reaproveitados, não é um banco novo).

### Frontend → Vercel

1. Importe o repositório na Vercel apontando o **Root Directory** para
   `frontend` (o Vercel detecta automaticamente Vite: build `vite build`,
   output `dist`).
2. Configure a variável de ambiente `VITE_API_URL` apontando para a URL
   pública do backend + `/api` (ex.:
   `https://backend-production-69d9.up.railway.app/api`).

### Backend + PostgreSQL → Railway

1. Provisione um serviço **PostgreSQL** no projeto Railway (ou reaproveite
   um existente).
2. Adicione um serviço a partir do repositório GitHub, com **Root
   Directory** `backend`.
3. Build command: `npm install && npm run prisma:generate && npm run build`.
   Start command: `npm run prisma:deploy && npm start`.
4. Configure as variáveis de ambiente do backend:
   - `DATABASE_URL` → referência ao serviço Postgres do próprio projeto
     (`${{Postgres.DATABASE_URL}}`), preenchida automaticamente.
   - `DRCLICK_API_URL`, `DRCLICK_TOKEN`/`DRCLICK_AUTHORIZATION`,
     `DRCLICK_CLINIC_IDS`, `DRCLICK_TELEFONIA_CHANNEL_ID` — mesmos valores
     usados em desenvolvimento.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — credenciais de login do sistema.
   - `JWT_SECRET` — **gere um valor novo e diferente do usado em
     desenvolvimento** (ex.: `openssl rand -hex 48`).
   - `FRONTEND_URL` — a URL de produção do Vercel (necessário para o CORS
     liberar o frontend a chamar o backend).
   - `NODE_ENV=production`, `PORT=3333`, `SYNC_CRON_ENABLED=true`,
     `SYNC_CRON_EXPRESSION=*/15 * * * *`.
5. Gere um domínio público para o serviço (Networking → Generate Domain).
6. Após o deploy, acesse `/api/health` para confirmar que o banco e as
   credenciais do Dr.Click estão configurados corretamente.

> Se o domínio do Vercel mudar (ex.: domínio customizado), atualize
> `FRONTEND_URL` no Railway — senão o CORS passa a bloquear o frontend.

## 16. Validação com dados reais

A integração foi validada contra o endpoint real
`GET /api/reports/schedulesofday` para o período de 18/08/2026. A colaboradora
**JOSIANE DINIZ DE ARAUJO** foi cadastrada manualmente em **Colaboradores** e
mapeada em **Dr.Click → Mapeamento de Colaboradores** à conta Dr.Click
`user_id=47c00c5f-5f44-4869-be84-3766fa873b1c`; a partir daí o Dashboard, o
Ranking e a Performance Individual passaram a exibir, para essa colaboradora:

| Indicador | Valor |
|---|---|
| Pacientes | 30 |
| Consultas | 22 |
| Exames | 7 |
| Procedimentos | 0 |
| Retornos | 6 |
| Combos | 1 |
| Faturamento | R$ 3.053,43 |
| Total de agendamentos (22+7+0+6) | 35 |

Todos os valores foram conferidos diretamente na interface (Dashboard,
Colaboradores, Ranking e Performance Individual) e via chamadas diretas aos
endpoints internos, refletindo fielmente o retorno da API — sem estimativas
ou recálculos.
