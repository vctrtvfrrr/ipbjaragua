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

**Publicado / Rascunho** (do Boletim):
Um **Boletim** com data até hoje (inclusive) está publicado e aparece no site. Com data futura é rascunho de uma edição ainda não publicada e não aparece em nenhum lugar do site (índice, busca ou URL direta) — salvo pelo **Preview**. Não há coluna de status: a data é o único critério de publicação. A **Liturgia** não segue esta regra — nela a publicação é um status explícito (ver [ADR-0020](./docs/adr/0020-liturgy-publication-by-explicit-status.md)).
_Avoid_: Agendado, oculto, despublicado.

**Preview** (do Boletim):
A pré-visualização compartilhável de um **Boletim** ainda em Rascunho: a própria página pública, renderizada via um query param que dispensa a trava de data futura. Existe para que o link seja enviado a outras pessoas durante a revisão. É **aberto** — não exige autenticação, pois o conteúdo não é sigiloso —, mas emite `noindex` e não é linkado de nenhuma página pública, de modo que buscadores não o indexam e a URL sem o param segue invisível. Renderiza apenas as **Liturgias** publicadas daquela data: o Preview não é porta de saída para Liturgia em Rascunho.
_Avoid_: prévia, rascunho compartilhável.

**Janela de Correção** (derivada de `date` e `created_at`):
O período em que um **Boletim** ainda pode ter sua **data** alterada ou ser **excluído**: enquanto é Rascunho (data futura) **ou** foi criado há menos de 7 dias (`created_at >= now() - 7 dias`). Fora dela, o Boletim é um **registro fechado** — data e existência imutáveis; título, Edição, Artigo e flags de seção seguem editáveis. Derivada, não uma coluna. A exclusão é sempre hard-delete (o Boletim é mero agregador, nada o referencia por FK).
_Avoid_: bloqueio, trava, lock.

**Edição** (`bulletins.edition`):
O número sequencial de um **Boletim** desde o primeiro, que é a Edição 1, publicada em 2025-02-09. Valor armazenado, não derivado da cadência semanal (que pode ter falhas).
_Avoid_: Número, volume.

**Ano**:
A "idade" de um **Boletim** em anos completos desde a data do primeiro boletim (2025-02-09), começando em I. Derivado da data, exibido em algarismo romano ("Ano II"). Não confundir com ano-calendário nem ano litúrgico.
_Avoid_: Volume, temporada.

**Artigo** (`articles`):
Texto autoral publicado no site, com título, autor, data e conteúdo. O **autor** (`author_id`) é uma referência viva a um **Usuário** — não texto livre nem um **Membro** (ver ADR-0013): exibido pelo `name` atual do Usuário, com fallback "Redação" no site público (nunca o e-mail). Pode ser referenciado por um **Boletim**, mas existe de forma independente. Na criação, recebe aleatoriamente uma **Imagem Destacada** do banco (`featured_image_id`).
_Avoid_: Post, notícia, meditação.

**Resumo** (`articles.excerpt`) **/ Descrição** (`liturgies.description`):
O texto curto que sintetiza uma publicação para o leitor e para os buscadores — vitrine do recurso na listagem pública (grid de **Artigos**, listagem de **Liturgias**) e, ao mesmo tempo, a `<meta name="description">` da sua página. Escrito na voz do conteúdo — 1ª pessoa do plural, tom pastoral —, deve refletir a **mensagem central** (de preferência a aplicação prática), não apenas descrever o conteúdo. É opcional: sem ele, a página **omite** a meta tag. O operador o escreve à mão, podendo pedir uma sugestão gerada por IA (ver [ADR-0019](./docs/adr/0019-openai-for-meta-description-generation.md)); a sugestão nunca grava sozinha, é sempre revisável. No **Artigo** chama-se **Resumo**; na **Liturgia**, **Descrição** — mesmo conceito, campos distintos.
_Avoid_: meta description (é o uso técnico do texto, não o conceito), SEO text, legenda.

**Imagem Destacada** (`featured_images`):
Imagem **decorativa** de um banco compartilhado, exibida no topo de um recurso do site. O operador a envia pelo painel e ela é normalizada (WEBP, máx. 1600px de largura); os bytes vivem em disco, a linha guarda só o `id` e um `path` opaco (token aleatório). O vínculo com um recurso é **sorteado uma vez na criação** e depois **estável** — editar o recurso não re-sorteia; excluir a Imagem desfaz o vínculo (`ON DELETE SET NULL`). Sem imagem vinculada — banco vazio na criação, ou imagem excluída/arquivo ausente — o recurso cai numa **imagem de fallback** estática. O banco é **genérico por design**; hoje só o **Artigo** o consome.
_Avoid_: Thumbnail, capa, banner, imagem de artigo (o banco não pertence a um recurso específico), imagem informativa (é decorativa — o `alt` vem do contexto do recurso, não da imagem).

### Culto

**Liturgia** (`liturgies`):
A ordem de um culto numa data e horário específicos. É estruturada em **Atos**, que por sua vez contêm **Momentos**. Diferente do **Boletim**, publica por **status explícito** e não pela data: uma Liturgia publicada aparece no site mesmo com data futura. Toda Liturgia possui horário.
_Avoid_: Culto (o culto é o evento; a Liturgia é sua ordem documentada), ordem de serviço.

**Publicado / Rascunho** (da Liturgia, `liturgies.status`):
Uma **Liturgia** publicada aparece no site independentemente da data, inclusive futura. Em Rascunho, é renderizada só para quem tem permissão de leitura de Liturgia — e sinalizada como Rascunho onde aparece — sendo 404 para o visitante. A data não interfere: publicar e despublicar são escolhas do operador, nos dois sentidos (ver [ADR-0020](./docs/adr/0020-liturgy-publication-by-explicit-status.md)).
_Avoid_: Agendado, oculto, despublicado, não publicado.

**Próxima Liturgia**:
A Liturgia publicada mais cedo entre as que ainda vão acontecer — a de hoje cujo horário não venceu ou, não havendo, a mais próxima em data futura. É ela que a home destaca; Rascunhos nunca entram nessa escolha, porque o destaque aponta para uma página que o visitante precisa conseguir abrir. Quando não há nenhuma à frente, a home recua para a **última realizada**, e diz ao leitor qual das duas está mostrando.
_Avoid_: Última liturgia, próximo culto (o culto é o evento).

**Tipo de Culto**:
A designação do culto — "Culto Solene", "Culto de Ações de Graças" etc. Hoje vive na coluna `liturgies.theme`, nome enganoso (ver _Ambiguidades sinalizadas_).
_Avoid_: Tema (não é o assunto/tema do sermão).

**Ato** (`liturgy_acts`):
Uma divisão ordenada de uma **Liturgia** ("Adoração ao Rei", "Confissão ao Rei"...). Contém **zero ou mais Momentos** em ordem; um Ato sem Momentos é um marcador estrutural válido (ex.: "Pausa" ou "Interlúdio"), exibido só pelo nome.
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
Uma pessoa no rol da igreja, com dados de membresia e um **Status de Membro**. Fonte dos aniversariantes exibidos no **Boletim**. Não tem nenhuma relação com **Usuário**: a membresia é eclesiástica, não dá acesso ao painel.
_Avoid_: Usuário (é outro conceito — quem opera o painel), fiel, congregado.

**Status de Membro** (`members.status`) vs. **Exclusão** (`members.deleted_at`):
Dois eixos independentes e não redundantes. O **Status** tem cinco valores em dois grupos. Quatro são a **situação eclesiástica** da pessoa no rol — `active`, `transferred`, `deceased`, `removed` (transferida, falecida, removida por disciplina/rol) — registro histórico legítimo: o Membro **permanece no rol**, apenas sai dos aniversariantes (só `active` entra, ver ADR-0004). O quinto, `pending`, é um estado de **moderação**: a submissão do **Cadastro Público** entra como `pending`, fora do rol operacional, até um Usuário revisar e promover para `active`. A **Exclusão** (soft-delete) é **correção de cadastro** — duplicata, engano ou spam: o registro **some do rol**. "Excluir" nunca é o caminho para registrar que alguém saiu da igreja — isso é Status.
_Avoid_: tratar `status = 'removed'` e Exclusão como sinônimos; tratar `pending` como situação eclesiástica.

**Comungante / Não-Comungante** (derivado de `members.prof_faith_year`):
Distinção presbiteriana dentro do rol ativo. **Comungante**: **Membro** `active` que já fez profissão de fé (`prof_faith_year` preenchido) — admitido à Ceia. **Não-Comungante**: **Membro** `active` ainda sem profissão de fé (`prof_faith_year` nulo) — tipicamente o batizado que não professou. É **derivado**, não uma coluna: a presença de `prof_faith_year` é o único critério.
_Avoid_: coluna/flag de comungante (é derivado), catecúmeno.

**Ex-Membro** (derivado de `members.status`):
**Membro** cujo Status não é `active` nem `pending` — transferido, falecido ou removido. Continua no rol como registro histórico; é agrupado à parte da membresia vigente. Termo de agrupamento, não uma coluna.
_Avoid_: membro inativo, desligado.

**Cadastro Público** (formulário público de membro):
Formulário no site público, sem autenticação, pelo qual um **Visitante** (na prática, um membro existente ainda fora do sistema) submete seus dados para entrar no rol. A página não é linkada pela interface pública; o acesso ocorre por compartilhamento do link direto. A submissão cria um **Membro** `pending` (nunca `active`) — nunca aparece no site nem nos aniversariantes até um **Usuário** revisá-la e promovê-la (ver [ADR-0015](./docs/adr/0015-public-member-registration-lands-as-pending.md)). É a única origem de Membros `pending`; o cadastro pelo painel nasce já com situação eclesiástica definida.
_Avoid_: autocadastro (o acesso ao rol depende de revisão), inscrição.

**Aniversário de Casamento**:
A data de núpcias de um casal em que **ambos** os cônjuges são **Membros** ativos. Exibido na seção Aniversariantes do **Boletim** ao lado dos aniversários de nascimento, como o casal unido por um coração ("Mulher ♥ Homem"). Não há vínculo formal entre cônjuges no rol — o casal é reconstruído pelo cruzamento de nome e data de casamento (ver ADR-0004).
_Avoid_: Bodas, aniversário de núpcias.

**Agenda / Evento** (`agenda`):
Um compromisso da igreja, sempre **datado** (`event_date`) — não há recorrência armazenada. O `time` (horário) é opcional; vazio significa evento de dia inteiro. Uma data no passado é permitida (Boletins antigos ainda renderizam seus Eventos). Uma janela da Agenda é exibida no **Boletim** e na home. Ver [ADR-0014](./docs/adr/0014-events-always-dated-recurrence-via-repeat.md).
_Avoid_: Calendário (a Agenda é a coleção; o Evento é a entrada), Evento recorrente (não existe mais; repetição é feita via **Repetir Evento**).

**Repetir Evento**:
A ação de duplicar um **Evento** como um novo, sem recorrência armazenada. Abre o formulário de criação pré-preenchido a partir de um Evento existente (título, descrição e horário copiados), com a data **sugerida** para a semana seguinte à de hoje, no mesmo dia da semana do Evento original — o operador pode alterá-la antes de salvar. É a forma de "repetir" um compromisso: o operador planeja a agenda semana a semana, e cada semana tem seus próprios Eventos explícitos.
_Avoid_: Recorrência, agendamento (não há regra automática; cada Evento é uma entrada avulsa).

**Aviso** (`announcements`):
Mensagem com prazo de validade (`expires_at`, o último dia em que ainda é exibida), opcionalmente com link. Exibida no **Boletim** e na home (seção "Avisos Gerais"). É uma mensagem **viva, não um instantâneo**: cada Boletim mostra os Avisos vigentes na _sua_ data (não na data de hoje), e o vínculo é derivado da data, não uma referência guardada — por isso editar ou excluir um Aviso altera retroativamente o que Boletins passados exibem. Essa retroatividade é conhecida e aceita.
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
