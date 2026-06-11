---
number: 1
title: SQLite + Drizzle em servidor próprio, com migrations como fonte da verdade
date: 2026-06-10
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O site precisa de persistência read-write em tempo de execução: o conteúdo (boletins, artigos, liturgias) será criado e editado por uma área administrativa dentro do próprio app Next.js, por pessoas da igreja, não por desenvolvedores. Isso exige um banco com escrita em runtime, não conteúdo estático no build.

Duas restrições moldaram a decisão:

- O app roda em **servidor próprio** (VPS/Docker), com filesystem persistente — não em ambiente serverless.
- A escala é pequena: uma igreja, baixa concorrência, uma única instância.

## Decisão

Adotar **SQLite como arquivo local** (`./data/db.sqlite`, caminho fixo no código), acessado via **Drizzle ORM** com o driver **better-sqlite3**, em deploy **self-hosted**.

As **migrations são a fonte canônica do schema**. São versionadas no git (`db/migrations/`), geradas com `drizzle-kit generate` e aplicadas com `drizzle-kit migrate` **no start do container**, antes do `next start`.

O schema Drizzle fica dividido por entidade (`db/schema/*.schema.ts`) e modela **todas** as tabelas do domínio, não apenas as expostas no site, para evitar que um `generate` futuro produza migrations destrutivas.

## Solução

- **SQLite + arquivo local** é adequado à escala e ao deploy self-hosted: backup é copiar um arquivo, zero serviço externo, zero ops de banco.
- **better-sqlite3** é o driver SQLite mais maduro e testado do ecossistema Drizzle, síncrono e simples de usar em Server Components/Actions. (Exige `serverExternalPackages: ['better-sqlite3']` no `next.config.ts` por ser addon nativo.)
- **Migrations como fonte da verdade + migrate no start** dá histórico auditável e revisável em PR, e torna o deploy idempotente numa instância única. `drizzle-kit push` foi descartado por ser arriscado com dados reais.
- **Caminho fixo no código** mantém a configuração simples; não há necessidade atual de apontar para arquivos diferentes por ambiente.

## Alternativas Consideradas

- **PostgreSQL / banco gerenciado.** Rejeitado: excesso de infra e operação para a escala de uma igreja em servidor próprio.
- **libSQL/Turso.** Rejeitado por ora (mantém-se como caminho de migração se um dia for para serverless); sem necessidade atual de banco remoto.
- **`drizzle-kit push` em vez de migrations versionadas.** Rejeitado: sem histórico e arriscado com dados reais.

## Consequências

- O arquivo `data/db.sqlite` deve viver em volume persistente e ficar fora do git (gitignored); o backup é uma cópia do arquivo.
- O entrypoint do container precisa rodar `migrate` antes de subir o servidor. (O Dockerfile/entrypoint ainda não existe e fica fora do escopo desta decisão.)
- Por ser instância única, não há estratégia de concorrência de escrita; escalar horizontalmente exigiria repensar o banco (provável gatilho para reabrir este ADR).
