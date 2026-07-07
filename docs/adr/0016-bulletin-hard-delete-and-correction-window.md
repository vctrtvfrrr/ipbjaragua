---
number: 16
title: Boletim usa hard-delete, protegido pela Janela de Correção
date: 2026-07-07
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

Ao desenhar o CRUD de **Boletim** no painel (#17), duas questões de ciclo de vida se cruzaram.

A primeira é a **unicidade**: `bulletins.date` e `bulletins.edition` são `unique` no banco, e essas constraints valem para **todas** as linhas — inclusive as soft-deletadas. Com o soft-delete padrão (`deleted_at`, o campo comum a quase todas as entidades), apagar um boletim **queimaria** para sempre aquela data e aquele número de edição: uma recriação na mesma data estouraria a constraint, e o número ficaria inutilizável. O operador que apagasse por engano e tentasse recriar levaria um erro de constraint opaco.

A segunda é a **natureza do Boletim**: ele é um mero agregador. Não tem dados próprios além de `title` e `edition` — compõe Artigo (por referência), Liturgia, Agenda, Avisos e Aniversariantes, todos derivados da data ou referenciados. E **nada o referencia por FK**: `article_id` faz o Boletim apontar *para* o Artigo (o Boletim é o filho); Liturgia, Agenda e Aviso se vinculam por data, não por chave. Logo, apagar a linha não deixa órfãos.

## Decisão

O **Boletim** é a única entidade sem soft-delete: toda exclusão é **hard-delete**. A coluna `deleted_at` é removida de `bulletins`.

A irreversibilidade do hard-delete (e a alteração de data, que muda a URL pública e recalcula as seções) é limitada pela **Janela de Correção**, regra derivada de `date` e `created_at`:

- Um Boletim pode ter a **data** alterada ou ser **excluído** enquanto for **Rascunho** (data futura) **ou** tiver sido criado há menos de 7 dias (`created_at >= now() - interval '7 days'`).
- Fora da janela, o Boletim é um **registro fechado**: data e existência imutáveis. Título, Edição, Artigo e flags de seção seguem editáveis.

A regra é enforçada na UI (campo/ação desabilitados) e no servidor (a Server Action rejeita a operação com mensagem de domínio); o servidor é autoritativo. A exclusão sempre pede confirmação.

## Rationale

Sem soft-delete, os `unique` de `date` e `edition` passam a refletir só linhas vivas: apagar libera a data e o número para reuso, e a listagem do admin não precisa mais filtrar `deleted_at`. Como o Boletim não tem dados próprios nem dependentes por FK, o soft-delete não protegia nada recuperável — só emprestava uniformidade com as demais entidades ao custo de constraints queimadas e um estado morto a arrastar em toda query.

O risco do hard-delete é apagar um registro histórico consolidado. A Janela de Correção neutraliza isso: depois de 7 dias publicado, o Boletim vira um registro fechado que não pode ser apagado nem re-datado — protegendo exatamente o que dá estabilidade a um boletim antigo (sua URL pública e seu número na sequência de Edições). Dentro da janela, corrigir um engano recente é trivial.

## Considered Alternatives

- **Manter soft-delete + índice único parcial (`WHERE deleted_at IS NULL`).** Liberaria os `unique` para linhas vivas sem perder o registro, mas reintroduz a complexidade de restore (duas linhas competindo pela mesma data/edição ao reativar) para proteger um dado que não vale recuperar. Rejeitado por complexidade sem ganho.
- **Exclusão sempre disponível (sem Janela de Correção).** Simples, mas deixa um boletim histórico consolidado a um clique de sumir para sempre. Rejeitado: a irreversibilidade do hard-delete pede a salvaguarda.

## Consequences

- Migração remove `bulletins.deleted_at`; read-queries (públicas e admin) perdem o filtro `isNull(deleted_at)`.
- O Boletim diverge do padrão comum `deletedAt()`. Esta é a razão de a divergência estar registrada aqui: não é esquecimento, é decisão.
- Hard-delete de um boletim publicado (dentro da janela) destrói sua URL pública permanentemente — daí a confirmação obrigatória.
