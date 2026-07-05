# IPB Jaraguá

Site da Igreja Presbiteriana do Brasil em Jaraguá. Publica conteúdo da igreja (boletins semanais, artigos, liturgias dos cultos) e mantém registros internos (rol de membros, repertório musical, agenda e anúncios). Este glossário define a linguagem do domínio; nomes em inglês entre parênteses são os identificadores correspondentes no código/banco.

## Glossário

### Publicações

**Boletim** (`bulletins`):
Publicação semanal da igreja, identificada pela data do culto. Compõe — não duplica — um **Artigo**, a(s) **Liturgia(s)** do dia, uma janela de eventos da **Agenda** e os Aniversariantes de um intervalo de datas (aniversários de nascimento de **Membros** e **Aniversários de Casamento** de casais). Só o **Artigo** é _referenciado por escolha_ (o autor do Boletim seleciona qual); **Liturgia**, **Agenda** e Aniversariantes são _derivados da data/das janelas_ — a Liturgia de um Boletim é toda Liturgia daquela data (podendo haver mais de uma, ex.: matutino e vespertino), não uma escolhida à parte. Cada seção pode ser exibida ou ocultada. Tem uma **Edição** e cai num **Ano**.
_Avoid_: Folheto, informativo.

**Boletim Dominical / Boletim Excepcional**:
Um **Boletim** cuja data cai num domingo é Dominical, o caso regular: traz sempre Agenda, Avisos e Aniversariantes. Um publicado em dia de semana, em caráter raro, é Excepcional: título variável e em geral sem essas seções. A distinção é derivada do dia da semana da data, não armazenada.
_Avoid_: Boletim especial, edição extra.

**Publicado / Rascunho**:
Um **Boletim** com data até hoje (inclusive) está publicado e aparece no site. Com data futura é rascunho de uma edição ainda não publicada e não aparece em nenhum lugar do site (índice, busca ou URL direta). Não há coluna de status: a data é o único critério de publicação.
_Avoid_: Agendado, oculto, despublicado.

**Edição** (`bulletins.edition`):
O número sequencial de um **Boletim** desde o primeiro, que é a Edição 1, publicada em 2025-02-09. Valor armazenado, não derivado da cadência semanal (que pode ter falhas).
_Avoid_: Número, volume.

**Ano**:
A "idade" de um **Boletim** em anos completos desde a data do primeiro boletim (2025-02-09), começando em I. Derivado da data, exibido em algarismo romano ("Ano II"). Não confundir com ano-calendário nem ano litúrgico.
_Avoid_: Volume, temporada.

**Artigo** (`articles`):
Texto autoral publicado no site, com título, autor, data e conteúdo. O **autor** (`author_id`) é uma referência viva a um **Usuário** — não texto livre nem um **Membro** (ver ADR-0013): exibido pelo `name` atual do Usuário, com fallback "Redação" no site público (nunca o e-mail). Pode ser referenciado por um **Boletim**, mas existe de forma independente.
_Avoid_: Post, notícia, meditação.

### Culto

**Liturgia** (`liturgies`):
A ordem de um culto numa data específica. É estruturada em **Atos**, que por sua vez contêm **Momentos**.
_Avoid_: Culto (o culto é o evento; a Liturgia é sua ordem documentada), ordem de serviço.

**Tipo de Culto**:
A designação do culto — "Culto Solene", "Culto de Ações de Graças" etc. Hoje vive na coluna `liturgies.theme`, nome enganoso (ver _Ambiguidades sinalizadas_).
_Avoid_: Tema (não é o assunto/tema do sermão).

**Ato** (`liturgy_acts`):
Uma divisão ordenada de uma **Liturgia** ("Adoração ao Rei", "Confissão ao Rei"...). Contém **Momentos** em ordem.
_Avoid_: Parte, seção.

**Momento** (`liturgy_moments`):
A menor unidade de uma **Liturgia**, dentro de um **Ato**, com um tipo: leitura bíblica, cântico, oração, sermão, sacramento ou outro. Conforme o tipo, carrega dados próprios (um cântico referencia uma **Música**; um sermão tem pregador; uma leitura tem passagens; um **Sacramento** tem seu tipo).
_Avoid_: Etapa, item.

**Sacramento**:
Um **Momento** do tipo sacramento, que deve especificar qual: batismo ou eucaristia. A regra "sacramento exige tipo" é garantida por restrição no banco.
_Avoid_: Ordenança.

**Música** (`songs`):
Uma peça do repertório musical (hinos, cânticos), com letra estruturada e quatro campos de catálogo: `track` (índice no hinário), `album` (nome do hinário), `performer` e `songwriter`. Referenciada por **Momentos** de cântico.
_Avoid_: Hino (hino é uma espécie de Música, não sinônimo), canção, faixa.

**Bloco de Letra** (estrutura interna de `songs.lyrics`, JSON):
A unidade de uma **Letra**: um objeto `{ type, number, content }`. `type` é `verse` (estrofe) ou `chorus` (refrão). `verse` tem `number` inteiro ≥ 1; `chorus` tem `number: null`.
_Avoid_: Estrofe (é apenas um tipo de Bloco; não nomeia o conceito geral).

**Referência** (campo calculado, não armazenado):
A atribuição de uma **Música** para exibição, derivada dos campos de catálogo por ordem de prioridade: (1) `track` + `album` → `"<track>. <album>"` (ex: `"45. Novo Cântico"`); (2) `performer`; (3) `songwriter`; (4) `null` se nenhum estiver preenchido. Hinos têm `track`+`album`; músicas contemporâneas têm `performer`; composições sem intérprete têm apenas `songwriter`.
_Avoid_: Autor, intérprete (são campos individuais; Referência é o campo calculado de exibição), crédito.

### Comunidade

**Membro** (`members`):
Uma pessoa no rol da igreja, com dados de membresia e um status (ativo, etc.). Fonte dos aniversariantes exibidos no **Boletim**. Não tem nenhuma relação com **Usuário**: a membresia é eclesiástica, não dá acesso ao painel.
_Avoid_: Usuário (é outro conceito — quem opera o painel), fiel, congregado.

**Aniversário de Casamento**:
A data de núpcias de um casal em que **ambos** os cônjuges são **Membros** ativos. Exibido na seção Aniversariantes do **Boletim** ao lado dos aniversários de nascimento, como o casal unido por um coração ("Mulher ♥ Homem"). Não há vínculo formal entre cônjuges no rol — o casal é reconstruído pelo cruzamento de nome e data de casamento (ver ADR-0004).
_Avoid_: Bodas, aniversário de núpcias.

**Agenda / Evento** (`agenda`):
Um compromisso da igreja. Recorrente (dia da semana + horário) ou pontual (data específica). Uma janela da Agenda é exibida no **Boletim**.
_Avoid_: Calendário (a Agenda é a coleção; o Evento é a entrada).

**Aviso** (`announcements`):
Mensagem com prazo de validade (`expires_at`), opcionalmente com link. Exibida no **Boletim** e na home (seção "Avisos Gerais").
_Avoid_: Anúncio (termo anterior), notificação, comunicado.

### Acesso ao painel

**Usuário** (`users`):
Pessoa autenticada que opera o painel administrativo, cadastrando e editando o conteúdo do site. Não tem relação com **Membro** — a membresia eclesiástica não concede acesso ao painel. Autentica-se via Google (OAuth), mas só consegue entrar se o seu e-mail estiver na lista de autorizados, formada por **Convite**. Cada Usuário carrega uma lista de **Permissões** que delimita o que pode fazer. O nome de exibição (`name`) é opcional no **Convite** e, quando vazio, é preenchido a partir do Google no primeiro login (sem nunca sobrescrever um nome já definido). Um Usuário **assina Artigos** (é o autor referenciado em `articles.author_id`); só Usuários `active` são ofertados como autor, e um Usuário com artigos não pode ser apagado (`ON DELETE RESTRICT`) — a revogação é sempre via _Desabilitado_. O primeiro Usuário é cadastrado manualmente no banco.
_Avoid_: Membro, administrador (todo Usuário do painel é administrativo; a alçada se distingue por Permissão, não por um papel à parte), conta.

**Convite**:
A autorização de acesso de um novo **Usuário**: um Usuário com permissão envia um convite a um e-mail Google, e esse e-mail passa a poder autenticar no painel. Autenticar via Google não basta — sem Convite, o acesso é negado.
_Avoid_: Cadastro (não há auto-cadastro; o acesso nasce de um Convite), registro.

**Convidado / Ativo / Desabilitado** (`users.status`):
Os três estados de um **Usuário**. _Convidado_ (`pending`): tem Convite mas nunca logou. _Ativo_ (`active`): logou ao menos uma vez e tem acesso. _Desabilitado_ (`disabled`): acesso revogado sem apagar o registro. A transição Convidado→Ativo acontece no primeiro login com e-mail correspondente; a revogação leva a Desabilitado. O **login não ressuscita** um Desabilitado (o e-mail segue na allowlist, mas barrado); só uma **reativação explícita pelo admin** (Desabilitado→Ativo, Permissões preservadas) restaura o acesso — Desabilitado é terminal para o login, não para o admin. Desabilitado→Convidado é proibido (reintroduziria a ressurreição por login). Apagar o registro é a revogação definitiva.
_Avoid_: Suspenso, inativo, bloqueado (nomes de código: `pending`/`active`/`disabled`).

**Visitante** (`guest`):
Quem acessa o site público sem estar autenticado. Termo usado só quando é preciso contrastar com **Usuário**; no resto do site, o público é simplesmente o leitor.
_Avoid_: Usuário (Visitante não é autenticado), anônimo.

**Permissão**:
Uma autorização concedida a um **Usuário**, na forma _entidade × ação_ (ex: criar Boletim, excluir Artigo). Um Usuário tem uma lista de Permissões; sem a Permissão correspondente, a ação não aparece nem é executável.
_Avoid_: Papel/role (a alçada é uma lista de Permissões por Usuário, não um papel nomeado), nível de acesso.

## Ambiguidades sinalizadas

- **`liturgies.theme` guarda o Tipo de Culto, não um tema.** A coluna se chama `theme`, mas seu conteúdo ("Culto Solene") é a designação do culto, não o assunto do sermão. O termo de domínio é **Tipo de Culto**; o nome da coluna é um resíduo a ser corrigido num futuro rename, não um conceito novo.
- **A tabela `announcements` guarda Avisos.** O termo de domínio é **Aviso**; `announcements` (tradução de "Anúncio") é resíduo do código, a ser reconciliado num futuro rename, não um conceito distinto.
- **Dominical vs Excepcional não é coluna.** O tipo do **Boletim** é derivado do dia da semana da data (domingo = Dominical), não um campo armazenado. Se um dia surgir um boletim de domingo que não seja Dominical (ou vice-versa), será preciso modelar o tipo explicitamente.

## Diálogo de exemplo

— "O Boletim de domingo já está pronto?"
— "Quase. A Liturgia está fechada — seis Atos, e o Momento do sermão já tem o pregador. Falta o Artigo que vai junto."
— "E os aniversariantes?"
— "Saem automático: o Boletim pega os Membros que fazem aniversário na janela da semana. A Agenda também entra, só os Eventos daquele intervalo."
— "Tem Sacramento nesse culto?"
— "Tem ceia — um Momento de Sacramento do tipo eucaristia, no Ato de Consagração."
