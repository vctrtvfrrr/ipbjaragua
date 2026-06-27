---
number: 10
title: Migração para Postgres compartilhado do VPS, com tipos ricos e Drizzle/postgres-js
date: 2026-06-27
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

A [ADR-0001](0001-sqlite-drizzle-self-hosted.md) escolheu SQLite como arquivo local e **rejeitou explicitamente o PostgreSQL** ("excesso de infra e operação para a escala de uma igreja em servidor próprio"). Aquela decisão se sustentava em três premissas: escala pequena, deploy self-hosted e backup = copiar um arquivo.

Três forças novas corroem essas premissas e forçam reabrir a decisão:

- **Tipos de coluna fracos.** No SQLite, datas, horas, instantes, booleanos, enums e JSON vivem todos como `text`/`int`. Não há `date`/`time`/`timestamptz`/`boolean`/enum/`jsonb` reais — o banco não valida nada disso, e a representação é frouxa.
- **Necessidade de edição remota.** Ainda não há painel administrativo (o **Usuário** do glossário não foi implementado). Editar conteúdo hoje exige acessar o arquivo SQLite no servidor. O objetivo imediato é conectar o **DBeaver** ao banco remoto e editar **Boletim**, **Liturgia**, **Música**, **Membro** etc. diretamente.
- **Padronização de infra.** O VPS do CodeLab já roda um **Postgres 17 compartilhado** por vários projetos, com provisionamento e backup padronizados via Ansible. Manter um SQLite isolado destoa desse padrão — e o argumento de "excesso de infra" da ADR-0001 se dissolve, pois a infra do Postgres já está de pé e operada.

## Decisão

Migrar toda a integração de banco para **PostgreSQL**, via **Drizzle ORM + driver `postgres-js`**, consumindo o **Postgres 17 compartilhado do VPS** através de uma **database dedicada por app**.

- **Topologia:** uma database dedicada (`ipbjaragua`) no servidor compartilhado, com role próprio. O provisionamento da database, do role e do acesso remoto é responsabilidade da **infra (Ansible)** — fora do escopo do projeto. A aplicação apenas consome uma **`DATABASE_URL`** única (fonte de verdade em dev e prod, lida tanto pelo runtime quanto pelo drizzle-kit).
- **Tipos ricos:** o motor novo é aproveitado para promover as colunas — `date` real (entregue ao código como `Date`, ancorado em UTC), `time` nativo, `timestamptz`, `boolean`, `pgEnum`, `jsonb` tipado, identity para ids, e o `check` do domínio portado. O comportamento de domínio observável é preservado (URLs de Liturgia, Aniversariantes, Dominical/Rascunho).
- **Migrations:** o histórico SQLite é descartado e uma única migration inicial Postgres é regenerada (`dialect: 'postgresql'`). A migração de schema continua **in-process** no boot (mecanismo da [ADR-0008](0008-container-standalone-in-process-migration.md)), agora via migrator do `postgres-js`.
- **Testes:** unitários em **PGlite** (Postgres in-process, WASM — hermético, sem container); e2e contra o **Postgres dockerizado** do `compose.dev.yml`.
- **Deploy:** com a `DATABASE_URL` virando segredo, o stack deixa de ser compose-only e passa a render-com-Vault (ver emenda na [ADR-0009](0009-codelab-deploy-stack-contract.md)).

A migração dos **dados** existentes é uma fase posterior, por script descartável, fora do escopo desta decisão.

## Rationale

- **Postgres compartilhado** elimina o contra-argumento central da ADR-0001: não há "excesso de infra" a montar — o servidor já existe, com backup (`pg_dump`) e provisionamento padronizados. Ganha-se acesso remoto (DBeaver) e padronização com os demais projetos do VPS, sem operar um banco novo.
- **`postgres-js`** é o driver assíncrono canônico do Drizzle, JS puro (sem addon nativo — some a fricção que ditou base Debian e `serverExternalPackages` na [ADR-0008](0008-container-standalone-in-process-migration.md)), adequado a uma instância de baixa concorrência.
- **Tipos ricos no banco e no código** são o objetivo declarado: integridade que o SQLite não oferecia (enum/check rejeitando valores, datas/instantes corretos) e padronização do tratamento de datas como `Date` no código, não só no schema.
- **Database dedicada** isola dados, backup e permissões dos demais projetos, e dá ao DBeaver um recorte limpo.

## Considered Alternatives

- **Manter SQLite.** Rejeitado: não resolve nenhuma das três forças — tipos continuam fracos, o acesso remoto continua sendo mexer no arquivo, e segue fora do padrão do VPS.
- **`date({ mode: 'string' })` em vez de `Date` real.** Rejeitado: criaria colunas `DATE` de verdade no banco sem reescrita transversal, mas a meta era padronizar o tratamento de datas **no código** — daí a escolha por `Date`, assumindo a reescrita de `lib/date`, `lib/bulletin`, páginas e o algoritmo de Aniversariantes.
- **Postgres gerenciado dedicado (não o compartilhado).** Rejeitado: reintroduz o "excesso de infra/operação" que a ADR-0001 recusou, sem ganho sobre a instância compartilhada que já existe.

## Consequences

- A camada de queries vira **assíncrona de ponta a ponta** (sem `.get()`/`.all()`/`lastInsertRowid`); o blast radius fica contido em `db/queries/*` e na infra de teste, pois as assinaturas públicas já eram `async`.
- O backup deixa de ser a cópia do arquivo SQLite (o label `backup.sqlite` some do `compose.yml`) e passa a ser `pg_dump` da database dedicada, responsabilidade da infra.
- Adicionar valor a um `pgEnum` depois exige `ALTER TYPE ... ADD VALUE` numa migration, não a edição de um array.
- A premissa de instância única se mantém; escalar horizontalmente deixa de exigir repensar o banco (o Postgres compartilhado já suporta), removendo o gatilho de reabertura que a ADR-0001 previa.
