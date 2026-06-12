# IPB Jaraguá

Site da Igreja Presbiteriana do Brasil em Jaraguá. Publica conteúdo da igreja (boletins semanais, artigos, liturgias dos cultos) e mantém registros internos (rol de membros, repertório musical, agenda e anúncios). Este glossário define a linguagem do domínio; nomes em inglês entre parênteses são os identificadores correspondentes no código/banco.

## Glossário

### Publicações

**Boletim** (`bulletins`):
Publicação semanal da igreja, identificada pela data do culto. Compõe — não duplica — um **Artigo**, uma **Liturgia**, uma janela de eventos da **Agenda** e os aniversariantes (**Membros**) de um intervalo de datas. Cada seção pode ser exibida ou ocultada. Tem uma **Edição** e cai num **Ano**.
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
Texto autoral publicado no site, com título, autor, data e conteúdo. Pode ser referenciado por um **Boletim**, mas existe de forma independente.
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
Uma peça do repertório musical (hinos, cânticos), com letra estruturada, autor e intérprete. Referenciada por **Momentos** de cântico.
_Avoid_: Hino (hino é uma espécie de Música, não sinônimo), canção, faixa.

### Comunidade

**Membro** (`members`):
Uma pessoa no rol da igreja, com dados de membresia e um status (ativo, etc.). Fonte dos aniversariantes exibidos no **Boletim**.
_Avoid_: Usuário, fiel, congregado.

**Agenda / Evento** (`agenda`):
Um compromisso da igreja. Recorrente (dia da semana + horário) ou pontual (data específica). Uma janela da Agenda é exibida no **Boletim**.
_Avoid_: Calendário (a Agenda é a coleção; o Evento é a entrada).

**Aviso** (`announcements`):
Mensagem com prazo de validade (`expires_at`), opcionalmente com link. Exibida no **Boletim** e na home (seção "Avisos Gerais").
_Avoid_: Anúncio (termo anterior), notificação, comunicado.

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
