---
number: 23
title: Passagem bíblica como Referência Bíblica interpretada com texto em snapshot
date: 2026-09-05
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

As **Passagens** de uma **Liturgia** eram três campos de texto livre — referência, versão e texto —, e o acervo mostra o custo disso: 340 Passagens com grafias divergentes, três referências sem nome de livro e o campo da **Versão** preenchido com `"Bíblia Online"`, o nome de um site, em todas elas.

Fechar esses campos exige uma fonte de texto bíblico. Isso esbarra no ethos do projeto: o app é enxuto e self-hosted ([ADR-0010](0010-postgres-shared-vps.md)), e a [ADR-0019](0019-openai-for-meta-description-generation.md) fixou as condições em que uma dependência externa de runtime é aceitável — módulo único, configuração explícita, acionamento não-automático e comportamento best-effort.

Há ainda uma restrição de licenciamento. Das 18 traduções do repositório `biblias`, apenas três são domínio público; as sete escolhidas para o Painel são todas de editoras. Citar perícopes num boletim de igreja é o uso corrente; copiar traduções inteiras para dentro deste repositório seria redistribuição, que a fonte explicitamente não autoriza.

## Decisão

Uma **Passagem** passa a guardar a **Referência Bíblica interpretada** (livro em código USFM, capítulos e versículos) ao lado do **texto e da Versão em snapshot**, gravados no momento do salvamento.

1. **A Referência Bíblica é estruturada e validada.** Uma referência que o interpretador não entende impede o salvamento, em Rascunho ou Publicado. É aqui que o campo aberto deixa de existir.
2. **O texto é snapshot, não referência viva.** A página pública nunca consulta a fonte externa: ela lê o que está no banco.
3. **A fonte é consultada apenas pelo Painel**, sob demanda, num módulo único, e sempre best-effort.
4. **A fonte é um fork sob controle do projeto**, `vctrtvfrrr/biblias@main`, servido por jsDelivr.
5. **A lista de Versões é constante de código** — sete traduções —, não um espelho do catálogo da fonte.
6. **O texto permanece editável** pelo operador, sem registro de que foi editado.

## Rationale

- **Snapshot protege o que já foi publicado.** Um **Boletim** impresso não pode mudar depois de distribuído, e a página de uma **Liturgia** não pode depender de um terceiro para renderizar. Guardar o texto no banco é o que mantém a dependência externa fora do caminho crítico, exatamente como a [ADR-0019](0019-openai-for-meta-description-generation.md) exige e como a [ADR-0018](0018-featured-image-bytes-on-disk-bind-mount.md) faz com bytes de imagem.
- **A Referência interpretada é o que efetivamente fecha o campo.** Ela é derivável e verificável a partir do que o operador escreve, sem rede, e é o único dos três campos que pode ser validado com rigor. Guardá-la, em vez de descartar o resultado do interpretador, é o que permite renormalizar a exibição e rebuscar em outra Versão com um clique.
- **Buscar sob demanda evita redistribuir texto sob copyright.** Sete das sete Versões oferecidas são de editoras. Resolver uma perícope na hora é citação; manter uma cópia das traduções neste repositório ou na imagem seria outra coisa.
- **O fork existe por disponibilidade, não por conteúdo.** O repositório original pode ser tornado privado, arquivado ou removido sem aviso; o fork garante que a fonte continue existindo. Como seu `main` só se move quando o projeto o sincroniza, o ref serve de pin sem exigir um SHA na URL.
- **A lista curada é uma trava editorial.** O catálogo da fonte inclui paráfrases que não se lê no culto. Uma constante de código impede que uma mudança lá fora altere sozinha o que o Painel oferece.
- **O texto segue editável porque a fonte não é perfeita.** A própria fonte mantém uma lista de versículos suspeitos de truncamento na origem, e a ARA — a Versão padrão — não tem nenhuma correção aplicada. Travar o campo tornaria "consertar uma frase cortada" uma operação de commit e deploy.

## Alternativas Consideradas

- **Referência viva, sem snapshot.** Fonte única da verdade e banco enxuto, mas põe os dados bíblicos no caminho crítico da página pública — embarcados custam ~5 MB por Versão no repositório e na imagem, remotos põem um terceiro entre o leitor e a Liturgia — e quebrariam as 340 Passagens do acervo.
- **Vendorizar as Versões no repositório, ou baixá-las no build.** Elimina a dependência de runtime e funciona offline, mas incha repositório e imagem e coloca cópias de traduções sob copyright dentro do projeto.
- **Importar a Bíblia para o Postgres.** Consulta indexada e sem rede, mas são ~31 mil linhas por Versão no Postgres compartilhado do VPS ([ADR-0010](0010-postgres-shared-vps.md)) e uma tabela de infraestrutura nova para um caso de uso acionado a cliques por um operador.
- **Pinar no repositório original, por tag.** URL mais legível e correções chegando de graça, mas mantém o projeto dependente de um repositório de terceiro continuar existindo — que é precisamente o risco que o fork existe para cobrir.
- **Texto read-only.** Cumpriria ao pé da letra "nada entra que não venha de uma tradução", ao custo de tornar irreparável, dentro do app, tanto um meio-versículo quanto um truncamento da fonte.
- **Marcar o texto editado.** Foi considerado e descartado: os dois casos reais de edição são aparar um fragmento e consertar um truncamento, e apresentar qualquer um deles ao leitor como "adaptado" informaria menos do que confundiria.

## Consequências

- Passa a existir uma chamada de rede a um terceiro no fluxo do Painel. É a segunda dependência externa a se apoiar na [ADR-0019](0019-openai-for-meta-description-generation.md), e a primeira a **divergir de sua trava 3**: a busca dispara com debounce enquanto o operador digita, sem botão. A leitura adotada é que a trava existe para manter a chamada fora do caminho de um save — o que continua verdadeiro —, e não para exigir um clique. Uma terceira dependência deve revisitar esta leitura.
- Nenhuma migração de DDL: `scripture_passages` já é `jsonb`. Há, porém, um backfill de dados sobre 340 linhas de produção.
- O formato do JSON de Passagem vira contrato: quem o lê precisa tolerar `citation: null` (acervo) e uma **Versão** fora da lista oferecida (`"Bíblia Online"`).
- Trocar de fonte de texto bíblico passa a ser reescrever um módulo pequeno, não uma migração.
- O acervo fica em dois regimes por tempo indeterminado: 337 Passagens com Referência Bíblica interpretada e texto de procedência desconhecida, e 3 sem interpretação nenhuma. A convergência é manual, quando um operador editar aquela **Liturgia**.
