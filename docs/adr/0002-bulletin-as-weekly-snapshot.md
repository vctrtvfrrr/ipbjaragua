---
number: 002
title: Bulletin sections are anchored to the bulletin, not to "now"
date: 2026-06-11
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

A **Boletim** (bulletin) compõe um **Artigo**, uma **Liturgia**, uma janela de eventos da **Agenda**, os aniversariantes (**Membros**) de um intervalo e os **Anúncios** vigentes. Cada uma dessas seções poderia ser resolvida de duas formas: relativa ao momento em que a página é aberta ("hoje") ou relativa à própria semana do boletim.

A tabela `bulletins` já carrega janelas armazenadas (`agenda_from/to`, `birthdays_from/to`) em vez de calcular intervalos a partir da data do culto. Ao popular as páginas de boletim, foi preciso decidir a mesma questão para os anúncios (filtrar por `expires_at >= hoje` ou `>= data do boletim`).

## Decisão

Toda seção do boletim é ancorada na própria data e nas janelas armazenadas do boletim, nunca no relógio do servidor:

- **Agenda** e **Aniversariantes** usam as janelas armazenadas (`agenda_from/to`, `birthdays_from/to`).
- **Anúncios** são filtrados por `expires_at >= bulletins.date` (a data daquele boletim).
- **Edição** é uma coluna armazenada; o **Ano** é derivado da data do boletim contra a âncora fixa `2025-02-09`.

Reabrir um boletim antigo reproduz exatamente o que ele exibia naquela semana.

## Justificativa

O boletim é o equivalente digital do folheto impresso semanal: um documento datado, não um painel ao vivo. Ancorar tudo na data do boletim dá **fidelidade histórica** — o arquivo de boletins é um registro fiel, e cada edição é reproduzível e cacheável de forma estável. A alternativa (resolver seções contra "hoje") faria boletins antigos exibirem agendas vazias, aniversariantes errados e nenhum anúncio, descaracterizando o arquivo.

O trade-off aceito: as seções não se "auto-atualizam". Corrigir o conteúdo de um boletim já publicado exige editar suas colunas/janelas — comportamento desejado para um documento datado.
