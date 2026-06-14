---
number: 004
title: Wedding anniversaries are built by pairing two members, never from free text
date: 2026-06-12
author: Victor Otávio Ferreira
status: accepted
---

## Context

A seção Aniversariantes do **Boletim** listava apenas aniversários de nascimento de **Membros** ativos. Quisemos incluir também os **Aniversários de Casamento**, exibidos como o casal unido por um coração ("Mulher ♥ Homem", mulher primeiro).

A tabela `members` já guarda `wedding_date`, `spouse` (texto livre com o nome do cônjuge) e `sex`, mas nada consumia esses campos. **Não há chave estrangeira ligando um membro ao seu cônjuge** — o único elo é o nome em texto livre em `spouse`.

Aferição nos dados de produção (81 membros ativos): 50 têm `wedding_date` não-vazio. Cruzando `spouse` de um membro com o `full_name` de outro membro ativo, o pareamento bidirecional (vale qualquer um dos dois sentidos) reconstrói **24 casais, cobrindo 48 dos 50 membros casados**. Os 2 restantes têm o cônjuge fora do rol (não-membro). Não há, hoje, datas de casamento compartilhadas por 3+ membros nem homônimos entre os elegíveis — o filtro de data é puramente defensivo.

## Decision

Um Aniversário de Casamento é construído **pareando dois Membros ativos**: o membro A pareia com o membro B quando `A.spouse == B.full_name` **e** `A.wedding_date == B.wedding_date` (não-vazio), ambos `status = 'active'` e não removidos (soft-delete). O par se forma se **qualquer um dos sentidos** casar, e os casais são deduplicados a uma única entrada.

- A comparação de nomes é **exata**, apenas aparando espaços nas pontas e colapsando espaços internos repetidos — sensível a acento, maiúscula e nomes do meio.
- Quando nenhum cônjuge-Membro é encontrado (cônjuge não é membro, grafias divergem, ou o parceiro está inativo/falecido), o Aniversário de Casamento é **omitido por inteiro** — nunca renderizamos meio casal.
- A exibição é `Mulher ♥ Homem` (♥ = U+2665), mulher primeiro pelo campo `sex`: se exatamente um cônjuge tem `sex = 'Feminino'`, ela vem primeiro; caso contrário (ambos iguais, ou algum nulo) a ordem é alfabética pelo nome de exibição. Cada nome usa até seus dois primeiros tokens, parando antes de uma preposição portuguesa (`de/da/do/dos/das/e`, sem distinção de maiúsculas) — assim "Ana Lúcia ♥ Júlio Cesar", mas "Riquiele Monico ♥ Evanildon Lopes".
- Casamentos reaproveitam a janela `birthdays_from`/`birthdays_to` (cruzada pelo mês-dia do `wedding_date`) e o toggle `show_birthdays` existentes — sem novos campos de schema no boletim. A seção é agrupada por dia, sob um cabeçalho `DD/MM — dia da semana`; dentro de cada dia, aniversários de nascimento vêm antes dos de casamento.

## Rationale

Parear Membros verificados, em vez de ler o texto livre de `spouse`, garante que ambos os nomes são reais e canônicos e permite ordenar pelo `sex` do parceiro. Exigir `wedding_date` coincidente além do nome elimina falsos pares de homônimos e de casais casados no mesmo dia, e protege contra erros de digitação no rol. A igreja prefere explicitamente **omitir** um casal cujo cônjuge não é membro a renderizar meio casal ou confiar em texto não-verificado — aceitando que os poucos casados com cônjuge fora do rol não apareçam.

## Considered Alternatives

- **Usar o texto livre de `spouse` direto** (`primeiro nome do membro` ♥ `primeiro nome do cônjuge`). Cobriria casais com só um cônjuge membro, mas renderiza texto não-verificado, não permite ordenar pelo `sex` do parceiro e duplicaria o casal quando ambos são membros. Rejeitado em favor do pareamento verificado.
- **Parear só por `wedding_date`.** Mais simples, mas confunde casais distintos casados no mesmo dia e quebra quando 3+ membros compartilham a data. Rejeitado.
- **Toggle/campo `show_weddings` separado.** Mais controle, mas exige migração e UI de admin para uma seção que conceitualmente é uma lista só. Rejeitado como fora de escopo.

## Consequences

- O match `spouse` ↔ `full_name` é **frágil a grafia**: apelido, nome do meio faltando ou acento divergente derruba o casal silenciosamente. Aceito; o remédio é higiene de dados no rol, não afrouxar o match. (Durante esta decisão, corrigiu-se o `wedding_date` de um membro cujo ano divergente derrubava um casal real.)
- Aniversários de nascimento renderizam o `full_name` completo, enquanto casamentos usam até dois tokens — a mesma lista mistura nomes longos e curtos, por desenho.
- Um Aniversário de Casamento desaparece no instante em que qualquer cônjuge fica inativo (transferido, falecido, removido), sem sinal separado.
