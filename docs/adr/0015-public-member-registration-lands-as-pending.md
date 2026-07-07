---
number: 015
title: Cadastro público de membro entra como pending, moderado no mesmo enum de status
date: 2026-07-07
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

Vamos abrir um **Cadastro Público** — um formulário no site, sem autenticação — pelo qual membros já existentes cujos dados ainda não estão no sistema se recadastram no rol. Isso injeta dado **não verificado** de um **Visitante** dentro de `members`, uma tabela que o resto do domínio trata como fonte confiável: o ADR-0004 constrói os Aniversários de Casamento pareando **Membros** `active`, confiando que nome, sexo e data de casamento são reais.

Se a submissão pública criasse um Membro `active` na hora, qualquer um poderia fazer surgir um "aniversariante" fantasma no Boletim da semana ou poluir o rol com spam. Era preciso um estágio de moderação entre "o Visitante enviou" e "está no rol operacional".

O enum `member_status` tinha quatro valores — `active`, `transferred`, `deceased`, `removed` — todos descrevendo **situação eclesiástica**. Nenhum representava "aguardando revisão".

## Decisão

A submissão do Cadastro Público cria um **Membro** com `status = 'pending'`, um **quinto valor** adicionado ao enum `member_status`. `pending` é um estado de **moderação**, não de situação eclesiástica.

- `pending` é a **única** origem de Membros nesse status — o cadastro pelo painel nasce já com situação eclesiástica definida (`active` etc.). Não há transição de volta para `pending` pela UI.
- Um Membro `pending` fica **fora do rol operacional**: não aparece no site, e já cai fora dos Aniversariantes de graça, porque o ADR-0004 só considera `active`.
- A **promoção** `pending → active` é o fluxo de edição normal do painel (sem botão "Aprovar" dedicado): o operador abre o registro, completa o que falta e muda o status. A regra "`sex` obrigatório quando `status != 'pending'`" garante que ninguém entra no rol sem os dados que o ADR-0004 exige.
- O soft-delete (`deleted_at`) é o backstop humano contra spam que chega em `pending` — ver a distinção Status vs. Exclusão no `CONTEXT.md`.

## Justificativa

Reusar o enum de status é muito mais barato que uma entidade separada: uma migração de enum, a mesma tabela, a mesma tela de admin (uma aba "Pendente Aprovação"), e a exclusão da fila dos aniversariantes sai de graça pelo filtro `active` já existente. O volume é baixíssimo — algumas centenas de membros se recadastrando essencialmente uma vez —, então o rigor de uma segunda entidade não se paga.

## Alternativas Consideradas

- **Entidade separada de "solicitação de cadastro"** (`membership_requests`), promovida a Membro na aprovação. Mantém `members` 100% verificado por construção, mas custa uma segunda tabela, um fluxo de promoção e duplicação de schema, para um volume que não justifica. Rejeitada.
- **Escrever direto como `active`.** Simples, mas fura a premissa do ADR-0004 (dado verificado) e abre o Boletim a aniversariantes fantasmas e spam. Rejeitada.

## Consequências

- O enum `member_status` passa a **misturar dois eixos semânticos**: `pending` é moderação; os outros quatro são situação eclesiástica. Aceito e documentado no `CONTEXT.md`; o custo é lembrar que "status" não é um conceito único.
- Toda leitura que hoje assume "não-`active` = ex-membro" precisa excluir `pending` explicitamente (ex.: a aba "Ex-Membros" é `status NOT IN (active, pending)`).
- Como o Cadastro Público envia um e-mail de confirmação ao endereço informado, o formulário vira uma superfície de abuso (bot mandando e-mail a terceiros); mitigado por honeypot + rate limit, não por captcha.
