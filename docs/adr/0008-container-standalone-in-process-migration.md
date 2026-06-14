---
number: 8
title: Containerização com Next standalone, multi-stage e migração in-process no boot
date: 2026-06-13
author: Victor Otávio Ferreira
status: accepted
---

> **Emenda (2026-06-13):** a persistência em produção passou de volume nomeado para **bind-mount em `/opt/data/ipbjaragua`**, por exigência do contrato de deploy do CodeLab (ver [ADR-0009](0009-codelab-deploy-stack-contract.md)). A fricção de uid que motivou a escolha original pelo volume nomeado deixa de existir: a propriedade do diretório no host é provisionada pela infra (o volume já existe com dono uid 1000), fora do escopo deste projeto. As menções a "volume nomeado em `/app/data`" abaixo ficam como registro histórico.

## Contexto

O app roda em servidor próprio (VPS/Docker), conforme a [ADR-0001](0001-sqlite-drizzle-self-hosted.md), que deixou o Dockerfile explicitamente fora de escopo. Precisamos agora containerizar o projeto com dois ambientes a partir de uma única definição de imagem: desenvolvimento (com watch/HMR) e produção.

Forças em jogo:

- O `better-sqlite3` é um addon nativo (exige `serverExternalPackages` no `next.config.ts`), o que penaliza a compilação em musl/Alpine.
- O banco SQLite vive em `./data/db.sqlite`, num volume persistente, e é **escrito em runtime** — tanto pela aplicação quanto pela migração no boot.
- As migrations são a fonte canônica do schema (ADR-0001) e precisam ser aplicadas antes de o servidor atender requisições.
- A imagem de runtime deve ser a menor possível, sem carregar toolchain de build nem dependências de desenvolvimento.

## Decisão

**Dockerfile multi-stage** sobre `node:26-bookworm-slim` (glibc, mesma versão do ambiente local — sem divergência dev/prod; Debian evita a fragilidade do `better-sqlite3` em musl), com dois targets nomeados:

- **`dev`** — instala todas as dependências e roda `pnpm dev`. Usado com **bind-mount** do código-fonte do host e **volume anônimo em `/app/node_modules`** (para o `node_modules` compilado na imagem não ser sombreado pelo do host), orquestrado por `compose.dev.yml`.
- **`production`** — usa `output: 'standalone'` do Next. O stage de build roda `pnpm build`; o runner copia apenas `.next/standalone`, `.next/static`, `public` e **`db/migrations`** (incluindo `meta/`), roda como usuário não-root `node` e sobe via `node server.js`. Orquestrado por `compose.yml` com **volume nomeado** em `/app/data`.

**A migração roda in-process**, no `register()` do `instrumentation.ts` já existente, no boot do servidor standalone — não há entrypoint com `drizzle-kit migrate`.

pnpm é obtido via `corepack`. O stage de build inclui `build-essential` + `python3` para garantir a compilação do `better-sqlite3` caso o binário pré-compilado não exista para a plataforma; como o stage é descartado no multi-stage, isso não infla a imagem final.

## Rationale

- **`output: 'standalone'`** produz uma imagem de runtime muito menor (só as dependências rastreadas, sem o `node_modules` completo nem o CLI do Next). O custo é desviar do `pnpm start` literal: o runtime passa a ser `node server.js`. Pesamos os dois e o ganho de tamanho/superfície justificou a mudança no `next.config.ts`.
- **Migração in-process via `instrumentation.ts`** é o único mecanismo que sobrevive no standalone: o `drizzle-kit` é `devDependency` e não está na imagem de runtime. Reaproveita código que já existe, falha rápido se a migração quebrar (o servidor não sobe) e dispensa um entrypoint customizado. Em troca, exige copiar `db/migrations` explicitamente — os `.sql` são lidos do disco em runtime e o tracer do standalone não os inclui sozinho.
- **Usuário não-root + volume nomeado** garante que a escrita do SQLite funcione sem ajuste manual de permissão: o volume nomeado herda o dono (`node`, uid 1000) do diretório `/app/data` criado na imagem, na primeira inicialização. Rodar como root resolveria permissões, mas é má prática e contraria o default do standalone.

## Considered Alternatives

- **`node:*-alpine`.** Rejeitado: musl força build do `better-sqlite3` a partir do fonte e é historicamente mais frágil; o ganho de tamanho não compensa o risco.
- **`pnpm start` (sem standalone).** Rejeitado: manteria o `node_modules` de produção inteiro + CLI do Next na imagem de runtime, sem necessidade.
- **Entrypoint com `drizzle-kit migrate` antes do servidor.** Rejeitado: traria `drizzle-kit` e deps de dev pra imagem de runtime, inflando o standalone, e duplicaria o que o `instrumentation.ts` já faz.
- **Bind-mount do host para os dados em produção.** Rejeitado por ora: carregaria o uid do host e exigiria `chown` manual para casar com o uid 1000; o volume nomeado evita essa fricção.

## Consequences

- O `next.config.ts` passa a declarar `output: 'standalone'`, que afeta todo `next build` (inclusive local); o `next dev` ignora a opção.
- Qualquer nova dependência de arquivos lidos do disco em runtime (além de `db/migrations`) precisa ser copiada explicitamente para o runner — o tracer do standalone só inclui código JS importado.
- Há dois arquivos Compose por ambiente: `compose.yml` (produção) e `compose.dev.yml` (desenvolvimento).
