---
number: 014
title: Eventos são sempre datados; recorrência via Repetir, não armazenada
date: 2026-07-07
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O **Evento** (`agenda`) nasceu com dois modos mutuamente exclusivos: **recorrente** (repete num `weekday`) **XOR** **pontual** (cai numa `event_date`), com `is_recurring` como discriminador e `weekday`/`event_date` anuláveis conforme o modo. O `time` era ortogonal e opcional. Esse XOR vivia só no schema e na issue #13 (nunca virou ADR), e a leitura pública (`listAgendaInWindow`) tinha dois branches: recorrentes casavam por dia da semana dentro da janela; pontuais, por data.

Na prática, o operador não pensa em "regras de recorrência": ele planeja a agenda **semana a semana** e, quando um compromisso se repete, quer recriá-lo rapidamente para a semana seguinte, ajustando o que for preciso. O modo recorrente entregava uma flexibilidade — repetição perpétua automática — que não corresponde a esse fluxo e complicava tanto o schema (discriminador + normalização do modo não escolhido) quanto a leitura (match por weekday).

## Decisão

Todo **Evento** é sempre **datado**: `event_date` passa a ser `NOT NULL` e é o único critério de quando ele acontece. `time` continua opcional (vazio = evento de dia inteiro). As colunas `weekday` e `is_recurring` são **removidas** de `agenda`; não há mais modo, discriminador nem normalização.

A repetição deixa de ser uma propriedade armazenada e vira uma ação do operador — **Repetir Evento**: um atalho que abre o formulário de criação **pré-preenchido** a partir de um Evento existente (title, description e time copiados), com `event_date` **sugerida** como a data, na **semana seguinte à de hoje**, que cai no mesmo dia da semana do Evento original. A data é só sugestão — o operador pode alterá-la antes de salvar. Repetir não é Server Action nem Permissão própria: cai no fluxo de `create`.

O cálculo da data sugerida é um helper puro (`nextWeekDateForWeekday(reference, weekday)` em `lib/date.ts`): a janela seguinte é `currentWeekWindow(reference)` deslocada em 7 dias, e a data é a dessa janela cujo weekday bate com o do original — sempre relativo a hoje (data do clique), nunca à data do Evento original.

## Rationale

O modelo passa a espelhar o fluxo real: o operador enxerga uma lista de Eventos datados e, para os que se repetem, clica em Repetir e confirma a semana seguinte. Recorrência-por-duplicação troca uma regra implícita e perpétua por entradas explícitas e auditáveis — cada semana tem seus próprios Eventos, editáveis e excluíveis um a um, sem efeito colateral sobre as demais.

O schema perde duas colunas e a classe inteira de estados inconsistentes (recorrente com `event_date` preenchido, pontual sem `weekday`, ambos nulos). A leitura pública colapsa para um filtro trivial `event_date BETWEEN from AND to`. O "pular sempre para a semana seguinte" (mesmo quando o dia da semana ainda está por vir nesta semana) é deliberado: a semana corrente já foi montada na rodada anterior, então o alvo natural do Repetir é sempre a próxima.

## Consequências

- **Migração destrutiva:** `agenda` perde `weekday` e `is_recurring`; `event_date` vira `NOT NULL`. Não há dado de produção (só seed de teste), então a migração é limpa.
- `listAgendaInWindow` perde o branch de recorrentes; `AgendaEntry.resolvedDate` passa a ser sempre o próprio `event_date` (mantido para não mexer nos consumidores do Boletim/home).
- **Supera a modelagem XOR da issue #13**, que só existia no schema e no esboço da issue — nenhum ADR anterior é afetado.
