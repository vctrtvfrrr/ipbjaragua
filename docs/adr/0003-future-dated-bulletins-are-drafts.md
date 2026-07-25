---
number: 3
title: Boletim com data futura é rascunho; o site só mostra publicados
date: 2026-06-12
author: Victor Otávio Ferreira
status: accepted
---

> **Atualização (ADR-0012):** onde este ADR menciona as "janelas fixas" (`agenda_from/to`, `birthdays_from/to`) como colunas, leia-se "janela derivada da data". A decisão deste ADR (data futura = rascunho; a data é o único critério de publicação) não muda.

> **Atualização (#17 — Preview):** o "404 por URL direta" para data futura ganha uma exceção: a página pública aceita um query param de **Preview** que dispensa a trava de data e renderiza o Rascunho. O preview é **aberto** (sem autenticação — o conteúdo não é sigiloso), mas emite `noindex` e não é linkado de nenhuma página pública; a URL **sem** o param segue resultando em 404. A regra "data futura = rascunho, invisível por descoberta normal" permanece; só se abre uma porta explícita para pré-visualização.

> **Atualização (ADR-0020):** este ADR passa a valer **somente para o Boletim**. A **Liturgia**, que herdava a mesma regra, publica por status explícito desde o [ADR-0020](./0020-liturgy-publication-by-explicit-status.md) e aparece no site mesmo com data futura. Com isso o Preview de um Boletim em Rascunho renderiza apenas as Liturgias **publicadas** daquela data — a exposição transitiva de rascunhos deixa de existir.

## Contexto

Os **Boletins** são publicados semanalmente, em geral aos domingos. Para preparar uma edição com antecedência, é útil criar a linha no banco antes do dia em que ela deve ir ao ar. Surgiu então a pergunta: o que distingue um boletim "no ar" de um que ainda está sendo montado?

O modelo já carrega janelas fixas (`agenda_from/to`, `birthdays_from/to`) e uma **Edição** armazenada — ou seja, um boletim pode estar totalmente preenchido e mesmo assim não dever aparecer ainda. Não havia, porém, nenhuma marca de publicação: as queries públicas (`listBulletins`, `countBulletins`, `getBulletinByDate`) filtravam apenas `deleted_at`, de modo que qualquer boletim de data futura vazava no índice `/bulletins` e por URL direta.

## Decisão

Um **Boletim** com data até hoje (inclusive) está **publicado**; com data futura é **rascunho** e não aparece em nenhum lugar do site. Não há coluna de status: a data do boletim é o único critério de publicação.

- As queries públicas filtram `date <= hoje` além de `deleted_at` — índice, contagem, busca e detalhe. Um boletim futuro acessado por URL direta resulta em 404.
- "Hoje" é resolvido no fuso `America/Sao_Paulo` e passado como parâmetro às queries (como já se faz com `listActiveAnnouncements(asOf)`), mantendo-as puras e testáveis em vez de chamarem o relógio internamente.

## Justificativa

Usar a própria data como gate de publicação custa quase nada: a data já existe, já identifica o boletim e já define sua ordem. Uma coluna `status` separada seria mais um campo para manter em sincronia (e mais um estado inválido possível: publicado com data futura, ou rascunho com data passada). Para uma cadência semanal e datada, "publica quando chega o dia" é a regra natural.

O trade-off aceito: não dá para publicar um boletim **antes** da sua data nem manter um boletim de data passada como rascunho. Se algum dia isso for preciso (ex.: despublicar uma edição antiga, ou liberar a próxima com antecedência), será necessário um status explícito — momento em que esta decisão deve ser revisitada.

Esta regra é o complemento do [ADR 0002](./0002-bulletin-as-weekly-snapshot.md): lá, cada boletim é um snapshot ancorado na própria data; aqui, a data também decide _se_ o snapshot está visível. Já a **home** não é um snapshot — ela é ao vivo (Agenda da semana corrente calculada de "hoje", Avisos vigentes em "hoje"), e por isso não reusa as janelas armazenadas de nenhum boletim; só o card de destaque e a lista de boletins apontam para edições publicadas.
