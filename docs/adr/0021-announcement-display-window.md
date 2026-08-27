---
number: 21
title: O Aviso é delimitado por uma Janela de Exibição, com piso na data de criação
date: 2026-08-27
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O **Aviso** tinha uma ponta só: `expires_at`, o último dia em que aparece. A consulta que alimenta a home e o **Boletim** filtrava por "não expirou" contra uma data de referência — hoje na home, a data do Boletim no Boletim.

Sem piso, "não expirou" é verdade desde o começo dos tempos. Isso produzia duas consequências:

- **O acervo deixou de ser fiel.** Um Aviso escrito em agosto entrava em **todos** os Boletins anteriores cuja data fosse menor que o seu fim. Um Boletim de junho exibia um Aviso que não existia naquela semana, e a edição arquivada deixava de corresponder ao folheto distribuído. O [ADR-0002](./0002-bulletin-as-weekly-snapshot.md) prometia o contrário — "reabrir um boletim antigo reproduz exatamente o que ele exibia naquela semana" —, e para os Avisos essa promessa nunca foi cumprida.
- **Não havia como redigir com antecedência.** No instante em que era salvo, o Aviso já estava no ar. Preparar a comunicação da semana seguinte obrigava a esperar o dia certo para clicar em salvar.

## Decisão

O Aviso passa a ter uma **Janela de Exibição**: `starts_at` e `expires_at`, ambos obrigatórios e **inclusivos nas duas pontas**. Um Aviso aparece onde e quando a data de referência cai dentro da Janela. A regra de seleção continua **uma só** — os dois consumidores diferem apenas na data que passam.

- `starts_at` é `date`, `NOT NULL`, e o invariante `starts_at <= expires_at` é garantido por **restrição de banco** (`announcements_window_not_inverted`), não apenas pela validação de tela. Há precedente: "Sacramento exige tipo".
- `expires_at` fica **intocado**. Renomeá-lo para `ends_at` seria um rename gratuito espalhado por query, seed, testes e migrações anteriores; a assimetria de nome é resíduo aceito e está registrada em _Ambiguidades sinalizadas_ do glossário.
- **Os Avisos existentes recebem, na migração, o Início correspondente ao dia em que foram criados** — `LEAST((created_at AT TIME ZONE 'America/Sao_Paulo')::date, expires_at)`. O `LEAST` não é enfeite: um Aviso com fim no passado é caso suportado, e a data de criação sozinha abriria nessas linhas uma janela que fecha antes de abrir, violando a restrição.
- No painel, o status binário Vigente/Expirado vira o tri-estado **Agendado / Vigente / Expirado**, derivado da Janela contra hoje, e a listagem passa a ordenar pelo Início mais recente. A ordenação **pública** permanece por fim crescente: para o leitor, "o que sai de cartaz primeiro" continua sendo a ordem útil.
- O Início segue **livremente editável** depois da criação. Nada equivalente à **Janela de Correção** do Boletim: o Aviso é mensagem viva, e a data de uma atividade às vezes muda.

## Justificativa

O piso poderia ser qualquer data. Três candidatos foram considerados para as linhas já existentes:

- **Congelar o passado** — dar a cada Boletim publicado a lista de Avisos que ele exibia no momento em que foi publicado, materializando o vínculo. Preserva byte a byte o que já foi visto, mas exige uma tabela de vínculo, mata a mensagem viva (editar um Aviso deixaria de corrigir os Boletins) e contraria o [ADR-0002](./0002-bulletin-as-weekly-snapshot.md), que derivou as seções da data justamente para não guardar referências.
- **Uma data arbitrária** — a data da migração, ou o primeiro Boletim. Barata e sem lastro: plantaria no banco um número que não corresponde a nada.
- **A data de criação** — escolhida. É o único piso com **lastro factual**: a linha carrega o dia em que o Aviso passou a existir, e usá-lo faz o acervo dizer a verdade sobre trás também, não só sobre frente.

O trade-off aceito é explícito: **Boletins já publicados mudam de conteúdo com esta decisão**. Uma edição de junho que hoje exibe um Aviso de agosto vai deixar de exibi-lo. Isso não é regressão — é a correção do defeito descrito no Contexto, e o resultado é o que o ADR-0002 sempre prometeu. Quem reabrir um Boletim antigo depois desta mudança verá menos Avisos do que via antes; verá, porém, os Avisos que existiam naquela semana.

A data de criação é lida no fuso da igreja (`America/Sao_Paulo`), não no fuso da sessão que roda a migração. O dia em que o Aviso foi criado é o dia que a igreja viveu: um Aviso salvo às 22h de domingo foi criado no domingo, e um piso de segunda-feira o tiraria do Boletim daquele mesmo domingo — exatamente a fidelidade que esta decisão existe para restaurar.

O que **não** muda é a natureza do Aviso: ele continua sendo **mensagem viva, não instantâneo**. Editar ou excluir um Aviso segue alterando retroativamente o que Boletins passados exibem, e essa retroatividade continua conhecida e aceita. O que passou a ter piso é a **existência** — um Aviso não é mais retroativo até o começo dos tempos.
