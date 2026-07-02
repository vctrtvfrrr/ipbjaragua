---
number: 012
title: Janelas de Agenda e Aniversariantes do Boletim são derivadas da data, não armazenadas
date: 2026-07-02
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O **Boletim** exibe uma janela de eventos da **Agenda** e os Aniversariantes de um intervalo de datas. Desde o início essas janelas viviam como colunas armazenadas em `bulletins` (`agenda_from/to`, `birthdays_from/to`), preenchidas a cada criação — premissa dos [ADR-0002](./0002-bulletin-as-weekly-snapshot.md), [ADR-0003](./0003-future-dated-bulletins-are-drafts.md) e [ADR-0004](./0004-wedding-anniversaries-by-member-pairing.md).

Ao desenhar o editor de Boletim do painel, as colunas viraram fricção: são `NOT NULL`, então o editor teria que oferecer um seletor de intervalo em toda criação, e o valor "certo" é quase sempre a mesma semana canônica derivável da data. As janelas armazenadas davam uma flexibilidade — intervalo arbitrário por boletim — que nunca foi usada e não é desejada.

## Decisão

As janelas deixam de ser armazenadas e passam a ser **função pura da data `D` do Boletim**, computada no código. As colunas `agenda_from`, `agenda_to`, `birthdays_from`, `birthdays_to` são **removidas** de `bulletins`.

Sendo `S` o domingo mais recente até `D` (inclusive):

- **Aniversariantes** = `[S, S+6]` (domingo → sábado da semana corrente).
- **Agenda** = `[S+1, S+7]` (segunda → próximo domingo, a semana à frente).

Para um Boletim Excepcional (data em dia de semana), a âncora é a mesma: a semana que contém `D`.

## Rationale

O valor da janela é determinístico a partir da data, e a data do Boletim é imutável — logo a fidelidade histórica do [ADR-0002](./0002-bulletin-as-weekly-snapshot.md) se mantém: reabrir um boletim antigo reproduz a mesma janela, porque ela é recalculada da mesma data. O que se perde — intervalo customizável por boletim — nunca foi exercido. Em troca, o editor some com quatro campos obrigatórios e o esquema perde quatro colunas e a chance de estados inconsistentes (janela que não corresponde à data).

Agenda e Aniversariantes têm âncoras propositalmente distintas: Aniversariantes cobrem a semana corrente (inclui o próprio domingo do culto); a Agenda "olha pra frente", da segunda ao próximo domingo.

## Consequências

- **Migração destrutiva:** boletins cujas janelas armazenadas divergiam desta fórmula terão suas seções Agenda/Aniversariantes recalculadas ao serem reabertos. Aceito como parte da simplificação.
- As queries em `db/queries/bulletin-sections.ts` que hoje leem as colunas passam a computar a janela a partir da data do Boletim.
- **Supera parcialmente os ADR-0002, 0003 e 0004** no ponto específico "janelas armazenadas": onde eles descrevem colunas, leia-se "janela derivada da data". O princípio de cada um (snapshot ancorado na data; data futura = rascunho; casamentos reaproveitam a janela de aniversariantes) permanece intacto.
