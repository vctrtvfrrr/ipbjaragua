---
number: 9
title: Deploy via contrato do CodeLab deploy-stack (registry + compose-only)
date: 2026-06-13
author: Victor Otávio Ferreira
status: accepted
---

> **Emenda (2026-06-27):** com a migração para Postgres ([ADR-0010](0010-postgres-shared-vps.md)), a `DATABASE_URL` vira **segredo** e o stack **deixa de ser compose-only** — passa a render-com-Vault. Surge um **`.env.example`** (declarando `DATABASE_URL`); o `deploy-stack` renderiza o `.env` a partir dele, substituindo pelos segredos do **Ansible Vault**, e o `compose.yml` consome esse `.env`. Os inputs `bw-*` saem do `deploy.yml` (a infra não usa mais Bitwarden). O `compose.yml` perde o bind-mount `./data:/app/data` e o label `backup.sqlite=...`; o backup passa a ser `pg_dump` da database dedicada, responsabilidade da infra. As menções a "compose-only" e ao backup do arquivo SQLite abaixo ficam como registro histórico.

## Contexto

A [ADR-0008](0008-container-standalone-in-process-migration.md) definiu como a aplicação é containerizada, mas deixou em aberto _como_ a imagem chega ao servidor e sobe. O ambiente de produção é o VPS do CodeLab, que padroniza o deploy de todo stack pela composite action `codelab/deploy-stack`: ela faz `rsync` apenas do `compose.yml` para `/opt/compose/<service>/`, opcionalmente renderiza um `.env` a partir de um Vault (Bitwarden), e roda `docker compose up -d` contra o daemon do host.

Forças em jogo:

- O `deploy-stack` **não leva o código-fonte ao VPS** — só o `compose.yml`. Um `compose.yml` com `build:` não teria contexto para buildar no host.
- O app hoje lê apenas `DATABASE_PATH` em runtime; não há segredos nem `.env`. Pelo ADR-0001 do `deploy-stack`, a ausência de `.env.example` caracteriza um **stack compose-only**: o Vault nunca é destrancado.
- A convenção de persistência do CodeLab é bind-mount sob `/opt/data/<service>`. A existência e a propriedade desse diretório no host são **provisionadas pela infra**, fora deste projeto — o volume já existe com o dono adequado (uid 1000) e nem a imagem nem o CI o gerenciam.

## Decisão

A validação (lint, format, testes unitários e e2e) roda à parte, no `.gitea/workflows/validate.yml`, em todo push. O **build e o deploy** ficam no `.gitea/workflows/deploy.yml`, disparado em `release: published` (e `workflow_dispatch`), num único job `build-and-deploy` que roda no runner on-VPS (container com `/var/run/docker.sock` e `/opt/compose` montados):

1. login no `registry.codelab.tec.br` com secrets dedicados (`REGISTRY_USER`/`REGISTRY_TOKEN`);
2. `docker build --target production`, marcando a imagem com `:<sha>` e `:latest`;
3. push das duas tags;
4. `uses: https://git.codelab.tec.br/codelab/deploy-stack@master` com `service: ipbjaragua`, sem nenhum `bw-*` (modo compose-only).

Por isso o `compose.yml` de produção referencia `image: registry.codelab.tec.br/codelab/ipbjaragua:latest` (nunca `build:`) e persiste o SQLite via **bind-mount `/opt/data/ipbjaragua:/app/data`** — substituindo o volume nomeado da ADR-0008.

## Rationale

- **`image:` em vez de `build:`** é a única forma compatível com o `deploy-stack`, que só transporta o `compose.yml` ao host. Como o build e o `deploy-stack` rodam no mesmo job, sobre o mesmo daemon do host, a `:latest` recém-buildada já está local quando o `docker compose up -d` sobe. O push ao registry serve de imagem versionada para rollback.
- **Compose-only** porque não há segredos hoje: criar um `.env.example` vazio só para destrancar o Vault seria cerimônia inútil. Quando a autenticação (ADR-0006) entrar e trouxer segredos, basta adicionar `.env.example` e os `bw-*` — o `deploy-stack` passa a renderizar o `.env` automaticamente.
- **Bind-mount em `/opt/data/ipbjaragua`** segue a convenção de persistência do CodeLab (backup unificado sob `/opt/data`). A propriedade do diretório no host é responsabilidade da infra (o volume já existe com dono uid 1000), então o container roda não-root sem que a imagem ou o CI precisem ajustar permissão.
- **Secret dedicado para o registry** desacopla o push das permissões do ator do workflow, ao custo de manter o par de credenciais como Action secret.

## Consequences

- O critério "o `compose.yml` builda o target production" da issue original não vale para produção: quem builda é o job de CI; o `compose.yml` só dá pull. O build local do target `production` continua possível à parte (sem `deploy-stack`).
- Como build e deploy compartilham o daemon do host, o `compose.yml` não precisa de `pull_policy: always`. Se um dia o build migrar para outro runner, será preciso forçar o pull da `:latest` antes do `up`.
- Adicionar qualquer segredo de runtime exige criar `.env.example` e passar os quatro `bw-*` ao `deploy-stack`, migrando o stack de compose-only para render-com-Vault.
- O `compose.dev.yml` permanece local e independente deste fluxo — usa `build: target: dev` e não passa pelo `deploy-stack`.
