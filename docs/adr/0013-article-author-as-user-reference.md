---
number: 013
title: An article's author is a live reference to a Usuário, never free text
date: 2026-07-04
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O **Artigo** (`articles`) nasceu com `author` como `text` livre e anulável — qualquer string, sem vínculo com quem opera o painel. Na prática, todo artigo já publicado foi escrito por um **Usuário** (`users`) do painel, e o operador quer, ao criar/editar um Artigo, escolher o autor num select de Usuários: por padrão ele mesmo (o logado), mas podendo atribuir a qualquer outro Usuário cadastrado.

O glossário separa com rigor **Usuário** (quem opera o painel) de **Membro** (rol eclesiástico). O autor de um Artigo é um **Usuário**, não um Membro.

## Decisão

O autor de um Artigo passa a ser uma **referência viva** a um **Usuário**: a coluna `articles.author` (text) é substituída por `articles.author_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT`.

- **Referência viva, não snapshot.** O nome exibido segue o `users.name` atual; renomear um Usuário reflete nos seus artigos. Rejeitamos congelar o nome no momento da publicação (ver Alternativas).
- **NOT NULL.** Todo Artigo tem autor. Os artigos existentes estão todos atribuídos a um mesmo autor e são migrados por match de nome (ver Consequências). A lista admin deixa de exibir "—".
- **`ON DELETE RESTRICT`** como rede de segurança no banco. Na prática nunca dispara: a revogação de um Usuário é `status = 'disabled'` (o registro persiste e segue como autor), e toda exclusão no produto é soft-delete.
- **Elegibilidade.** O picklist oferece Usuários `active`. Na edição, o conjunto é `active ∪ {autor atual}`, para não trocar silenciosamente um autor que foi desabilitado. O servidor revalida a elegibilidade (defesa contra request forjado, no mesmo espírito do pipeline de mutations do #11): no create o `author_id` deve ser de um Usuário `active`; no update, `active` ou igual ao autor corrente.
- **Exibição quando `users.name` é null** (raro — todo `active` logou via Google e herdou o nome): no site público, `name ?? "Redação"` — nunca o e-mail, que é credencial de login; no painel, `name ?? email`, ajudando a distinguir homônimos. Por isso o e-mail nunca é projetado para componentes públicos (em especial os client).

## Justificativa

A referência viva casa com a natureza do dado: o autor É um Usuário do painel, e manter o elo permite futuramente listar "artigos deste Usuário" e garante nomes canônicos. `RESTRICT` + `NOT NULL` tornam a autoria um invariante que o banco protege, sem o custo de um snapshot que duplicaria o nome em cada linha.

## Alternativas Consideradas

- **Snapshot do nome (à la ADR-0002, Boletim como snapshot).** Congelar `author_name` no momento da escrita preservaria o histórico contra renomeações/exclusões de Usuário. Rejeitado: diferente do Boletim, o autor de um Artigo é uma entidade viva do painel, não um retrato semanal; a estabilidade de exibição não justifica a redundância, e `RESTRICT` já impede a exclusão que quebraria a referência.
- **Manter `text` e só gravar o nome do Usuário escolhido.** Zero migração, mas perde a referência (não sustenta "artigos por autor") e reintroduz texto não-verificado. Rejeitado.
- **`author_id` anulável / opção "sem autor".** Rejeitado: todo artigo tem autor; o operador sempre escolhe um Usuário (default o logado).

## Consequências

- **Migração por match de nome.** `UPDATE articles SET author_id = (SELECT id FROM users WHERE users.name = articles.author)`. Depende do texto do autor casar exatamente com um `users.name`; como todos os artigos atuais têm o mesmo autor, o match é uniforme. Um autor histórico sem Usuário correspondente exigiria resolução manual antes de aplicar o `NOT NULL`.
- **O `#11 toca o render de autor em todos os sites** (`ArticleDetail`, `ArticleGrid`, `BulletinArticle`, home e lista admin): `article.author` (string) some do tipo do banco; as read-queries passam a fazer join com `users` e expor `authorName` (e `authorEmail` só na lista admin).
- **Homônimos** ficam indistinguíveis no site público (só o nome); no painel o e-mail desempata.
- **Fragilidade a grafia na migração**, como em ADR-0004: nome divergente derruba o match. Aceito; o remédio é conferir o dado antes de migrar, não afrouxar o match.
