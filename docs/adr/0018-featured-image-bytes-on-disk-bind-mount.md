---
number: 18
title: Bytes das Imagens Destacadas em disco (bind-mount), fora do pg_dump
date: 2026-07-10
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O CRUD de **Imagem Destacada** (issue #30) precisa persistir os bytes de imagens enviadas pelo operador. É a primeira vez que o app guarda um artefato binário — até aqui, todo o estado vive no Postgres compartilhado ([ADR-0010](0010-postgres-shared-vps.md)), e o container é stateless: a [ADR-0009](0009-codelab-deploy-stack-contract.md) **removeu** o bind-mount `./data:/app/data` quando o SQLite saiu, e o backup passou a ser exclusivamente `pg_dump` da database dedicada, responsabilidade da infra.

Três forças em jogo:

- O volume de dados é pequeno e de baixa cadência — um acervo de dezenas de imagens que o operador sobe esporadicamente, cada uma normalizada para um WEBP de ~100–250 KB.
- A infra do CodeLab tem uma convenção madura de persistência local (bind-mount sob `/opt/data/<service>`, diretório provisionado com dono uid 1000) e faz backup só do Postgres.
- Não existe object storage (S3/MinIO) provisionado no VPS.

## Decisão

Guardar os bytes das Imagens Destacadas **em disco**, num bind-mount de volume persistente, reintroduzindo `/opt/data/ipbjaragua` no container. O Postgres guarda apenas a linha de metadados (`id` + `path` opaco); o arquivo físico vive em `<data-dir>/featured-images/<path>`. Servir os bytes por um route handler que faz stream do disco.

Consequência assumida explicitamente: **as imagens ficam fora do `pg_dump`**. Não haverá rotina de backup dedicada para o volume — as imagens são tratadas como **re-enviáveis**. Num restore do banco sobre um volume vazio, os Artigos com vínculo pendente caem no fallback estático, e o route handler devolve `302` para o fallback quando o arquivo não existe.

## Rationale

- **Disco casa com a convenção da infra** (`/opt/data`, uid 1000) e não exige serviço novo. Object storage foi rejeitado por reintroduzir exatamente o "excesso de infra/operação" que a ADR-0001 recusou e a ADR-0010 evitou — provisionar bucket, credenciais como segredo, client novo — sem ganho na escala de uma igreja.
- **Não inflar o `pg_dump`** mantém o backup do banco enxuto e rápido, e preserva a database dedicada como um recorte limpo de dados estruturados (útil para o DBeaver, ver ADR-0010). Imagens binárias em `bytea` cresceriam o dump sem que o custo se justifique, já que o conteúdo é re-obtenível.
- **Re-enviável é uma perda aceitável.** O acervo é curado manualmente e pequeno; recriá-lo após um desastre de volume é minutos de trabalho do operador, não perda de dado insubstituível. Isso torna a ausência de backup uma decisão consciente, não um esquecimento — daí registrá-la aqui.
- **`path` opaco (token aleatório), não `id`**, na URL pública e no nome do arquivo: evita expor contagem/ordem do acervo e enumeração.

## Alternativas Consideradas

- **Bytes no Postgres (`bytea`).** Rejeitado apesar de vantagens reais — backup grátis via `pg_dump` e container 100% stateless. O custo (dump inflado por binário re-obtenível, streaming sempre pela aplicação, DB misturando dado estruturado com blob) não compensou na escala do projeto. É a alternativa mais forte e a que um leitor futuro provavelmente cogitaria; a escolha por disco foi deliberada.
- **Object storage dedicado (S3/MinIO).** Rejeitado: nenhum serviço desses existe no VPS; provisioná-lo é infra desproporcional ao volume.
- **Backup dedicado do volume (via infra).** Rejeitado por ora: cobriria o desastre de verdade, mas readiciona responsabilidade operacional na infra — o oposto do enxugamento que a ADR-0009 fez ao remover o volume. Reabrível se o acervo um dia deixar de ser trivialmente re-enviável.

## Consequências

- Reaparece um bind-mount no `compose.yml` (e no `compose.dev.yml`), com um caminho de dados configurável. O tracer do standalone não afeta arquivos de runtime num volume, mas o diretório precisa existir com dono uid 1000 — provisionamento da infra, como na convenção anterior.
- Banco e disco podem divergir (restore do banco sem os arquivos). A robustez fica centralizada no route handler (`302` para o fallback quando o arquivo falta) — o front nunca precisa consultar o disco.
- Se um segundo tipo de artefato binário surgir, esta decisão é o precedente a revisitar (o mesmo trade-off backup-vs-simplicidade se repõe).
