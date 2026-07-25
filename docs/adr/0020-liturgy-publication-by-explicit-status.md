---
number: 20
title: A Liturgia publica por status explícito; o Boletim segue publicando por data
date: 2026-07-25
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

A **Liturgia** herdou do **Boletim** a publicação-por-data do [ADR-0003](./0003-future-dated-bulletins-are-drafts.md): com data até hoje está publicada, com data futura é rascunho e não aparece em lugar nenhum. A data era o único critério, sem coluna de status.

Isso amarra duas coisas que na prática são independentes: **quando o culto acontece** e **quando a ordem dele pode ser lida**. As consequências apareceram no uso:

- Não havia como publicar a ordem do próximo culto **antes** do dia — nem para quem só quer conferir onde será a leitura de domingo. A home, por isso, só podia destacar uma Liturgia do próprio dia, e o texto do card chegava a explicar a limitação ao visitante ("a ordem de um culto é publicada no dia em que ele acontece").
- Uma Liturgia de data futura era rascunho **por acidente**, não por escolha. Como o **Preview** do Boletim renderiza as Liturgias da data, o único jeito de mostrar a ordem de um culto futuro a um revisor era o vazamento transitivo por uma URL anônima — exposição que o [ADR-0003](./0003-future-dated-bulletins-are-drafts.md) e o glossário registravam como "conhecida e aceita".
- Não havia como manter uma Liturgia de data passada fora do ar, nem guardar uma meio montada sem que ela fosse ao ar sozinha ao chegar o dia.

O próprio ADR-0003 previu este momento: "se algum dia isso for preciso (ex.: despublicar uma edição antiga, ou liberar a próxima com antecedência), será necessário um status explícito — momento em que esta decisão deve ser revisitada".

## Decisão

A **Liturgia** ganha `liturgies.status`, um enum `'draft' | 'published'` com default `'draft'`. A data deixa de governar a visibilidade da Liturgia:

- **Publicada** aparece no site sempre, inclusive com data futura.
- **Rascunho** é renderizada apenas para sessões com permissão `liturgies.read`, e sinalizada visualmente onde aparece.
- O status é editável nos dois sentidos: uma Liturgia publicada pode voltar a rascunho.

O **Boletim não muda**: o ADR-0003 continua valendo integralmente para ele, data futura segue sendo rascunho, e o Preview por query param segue existindo. A assimetria entre os dois é deliberada.

Duas consequências que fazem parte da decisão, não dela derivadas por acidente:

- **A regra de visibilidade do rascunho vale para renderização, não para seleção.** Onde a Liturgia é renderizada — página de detalhe, item da listagem pública, seção do Boletim — o rascunho aparece para quem tem `liturgies.read`. Já o **destaque da home é curadoria** e considera somente Liturgias publicadas, para todo mundo: escolher um rascunho ali faria a home anunciar como próximo culto uma página que o visitante não consegue abrir.
- **O Preview do Boletim deixa de expor rascunhos.** Ele passa a renderizar só as Liturgias publicadas daquela data, e a exposição transitiva registrada no ADR-0003 e no glossário deixa de existir. O caso que ela atendia se resolve publicando a Liturgia futura, que agora é uma operação legítima.

## Justificativa

Publicar por data custava quase nada enquanto data e visibilidade coincidiam — e para o Boletim elas coincidem: ele é um snapshot semanal que só faz sentido a partir do seu domingo. A Liturgia é diferente: a ordem do culto tem valor **antes** do culto, para quem vai participar. Derivar a visibilidade da data, nela, esconde exatamente o conteúdo no momento em que ele é mais útil.

O enum foi escolhido sobre um booleano `is_published` porque o glossário já batiza os dois estados ("Publicado / Rascunho") e uma coluna com essas palavras faz banco, código e documentação falarem igual — `status = 'draft'` lê melhor que `NOT is_published`. Foi escolhido sobre um `published_at` nulável por segurança: um timestamp de publicação parece uma data de agendamento, e convida o próximo a compará-lo com `now()`, reintroduzindo a trava por data que esta decisão existe para remover.

A assimetria com o Boletim foi aceita em vez de resolvida. Estender o status ao Boletim uniformizaria o modelo, mas arrastaria a **Janela de Correção** ([ADR-0016](./0016-bulletin-hard-delete-and-correction-window.md)), que é derivada de "é rascunho?", e o **Preview**, cuja razão de existir é justamente a data futura travar a URL — regras assentadas, testadas e que ninguém pediu para mexer. A assimetria é o preço de manter o escopo honesto, e o efeito colateral que ela produz — um Boletim de data futura invisível cuja Liturgia daquela data pode estar publicada — é aceitável porque a Liturgia tem URL e valor próprios; ela não é uma seção do Boletim, é um recurso que o Boletim compõe.

Permitir despublicar (voltar a rascunho) foi decidido notando que `softDeleteLiturgy` já existia sem trava alguma: tirar uma Liturgia publicada do ar já era possível, e de forma mais destrutiva. Proibir a volta ao rascunho protegeria o registro público apenas no papel, enquanto a porta ao lado seguia aberta.

## Consequências

- **Backfill pela data na migração**, não `published` para tudo: `date <= hoje` (em `America/Sao_Paulo`) vira `published`, o resto fica no default `draft`. Assim a visibilidade do site no instante do deploy é idêntica à de antes.
- **Rascunho relaxa a validação; publicar valida tudo.** Salvar como rascunho exige apenas o que o banco impõe (data, horário, tipo de culto e tipo de sacramento quando houver); a validação completa da árvore roda ao publicar. Sem isso, "Salvar como rascunho" não serviria para guardar trabalho pela metade.
- **As páginas que podem renderizar rascunho variam por sessão**, então deixam de ser estáticas, respondem com cache privado e emitem `noindex` nesse caso. O 404 para anônimo já barra buscadores por si; o cuidado com cache existe porque há um CDN na frente ([ADR-0017](./0017-client-ip-from-cf-connecting-ip-behind-cloudflare.md)).
- **A contagem e a listagem públicas passam a divergir entre visitante e operador** quando houver rascunhos — o número de páginas da paginação não é mais o mesmo para os dois. É inevitável dado que a lista respeita permissão.
- **O destaque da home muda de significado**: passa a ser a próxima Liturgia ainda por vir (a mais cedo), não a mais recente já realizada, com o fallback para a última realizada quando não há nada à frente.
