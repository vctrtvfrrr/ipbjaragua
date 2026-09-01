---
number: 22
title: A Ata pertence a um Livro fechado no código, e a Permissão é concedida por Livro
date: 2026-09-01
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

A **Ata** vivia num único conjunto, implicitamente da Mesa Administrativa: a numeração era global, a capa do Livro exportado dizia "Mesa Administrativa" em texto fixo e uma única Permissão (`meeting_minutes`) liberava tudo. Mas a igreja registra atas de vários corpos de naturezas distintas — Mesa Administrativa, Conselho, Assembleia Geral, Sociedades Internas, secretarias — e essas atas são sigilosas entre si.

Sem separação, três coisas ficavam impossíveis: a **numeração** de cada corpo não podia existir (uma sequência única mistura a 2ª Ata da Secretaria de Música com a 40ª da Mesa); o **sigilo** não existia (quem lia a ata de um corpo lia a de todos); e o **rótulo** de uma Ata não dizia de quem ela era.

## Decisão

A Ata passa a pertencer a exatamente um **Livro de Atas**, escolhido na criação e **imutável** depois. O Livro é uma **lista fechada no código** — `mesa-administrativa`, `assembleia-geral`, `secretaria-de-musica` de início — com o enum do banco derivado dela, o mesmo arranjo que a entidade de Permissão já usa. Cada entrada declara `slug` (em português, também usado como segmento de URL — exceção deliberada à convenção de identificadores em inglês), `label` e `genitive` (a expressão flexionada completa, não derivada por regra de gênero).

A Permissão de Ata passa a ser concedida **por Livro**: a tabela de Permissões ganha um `scope` (cadeia vazia para toda entidade sem escopo), e o verificador ganha um terceiro parâmetro opcional — os pontos de chamada das outras entidades permanecem intactos. Uma concessão sem escopo declarado nunca autoriza, na mesma linha da regra que já valia para par entidade × ação não declarado.

A numeração passa a ser única por **(Livro, Número)**, não mais globalmente única. A navegação do painel troca o item "Livros de Atas" por uma seção com um filho por Livro legível. As rotas passam a levar o Livro como primeiro segmento; uma Ata pedida pelo Livro errado responde "não encontrado", nunca "acesso negado" — a segunda confirmaria a existência do registro a quem não pode saber dele.

## Justificativa

**Por que uma lista fechada, e não uma tabela de Livros cadastráveis pelo painel?** O conjunto de corpos da igreja muda por decisão eclesiástica rara, não por operação de tela. Uma tabela cadastrável multiplicaria: precisaria de CRUD, de estado (ativo/extinto), e de uma migração de dados só para popular a primeira leva — o mesmo custo de uma constante no código, mas com superfície maior. A lista fechada é o que torna a Permissão escopada barata: o enum do banco é gerado da mesma constante, e o catálogo de Permissões (`entidade × ação × Livro`) é enumerável em tempo de compilação.

**Por que escopar a Permissão dentro da entidade `meeting_minutes`, e não criar uma entidade por Livro?** Uma entidade por Livro (`meeting_minutes_mesa`, `meeting_minutes_musica`, ...) misturaria português e inglês no identificador, e remover um valor de enum no Postgres exige recriar o tipo — um Livro que deixasse de existir seria uma migração destrutiva. Uma tabela de concessão dedicada foi cogitada e recusada: criaria um segundo caminho de autorização, e o verificador de Permissão deixaria de ser a resposta única sobre a alçada de um Usuário — todo o resto do sistema teria que saber que a Ata é diferente.

**Por que o Livro é imutável após a criação, mesmo com a Ata ainda Pendente?** O Livro decide a numeração e a Permissão de quem pode ver a Ata; deixá-lo editável enquanto Pendente criaria uma janela em que o Número reflete um Livro e a Permissão outro. O risco aceito é conhecido: uma Ata criada no Livro errado fica lá, ocupando um Número — mitigado só na interface (o Livro em destaque no formulário e no texto do botão que grava), sem passo de confirmação adicional.

**Por que "não encontrado" para uma Ata de outro Livro, e não "acesso negado"?** O identificador da Ata é global, mas a Permissão é por Livro. Se a rota respondesse "acesso negado" para uma Ata que existe mas pertence a outro Livro, ela confirmaria a existência do registro a um Usuário que não tem por que sabê-la. "Não encontrado" é a resposta que não vaza informação.

## Consequências

A migração desta decisão tem quatro efeitos, na mesma migração: cria o enum do Livro e a coluna, preenchendo toda Ata existente com `mesa-administrativa`; troca a unicidade do Número pela unicidade por Livro e Número; atribui escopo `mesa-administrativa` a toda concessão de Ata já existente, para que ninguém perca nem ganhe acesso; e zera o `pdf_path` de toda Ata, para que o próximo acesso regenere o PDF com o cabeçalho novo — os arquivos órfãos em si permanecem no volume até uma limpeza operacional, porque a linha é canônica e o arquivo é derivado.

Conselho, Sociedades Internas e Superintendência da Escola Bíblica Dominical ficam fora da lista até existirem de fato. Não há CRUD de Livros pelo painel, não há como mover uma Ata de Livro, e não há página de índice de Livros — a navegação é o submenu, na ordem da lista no código.
