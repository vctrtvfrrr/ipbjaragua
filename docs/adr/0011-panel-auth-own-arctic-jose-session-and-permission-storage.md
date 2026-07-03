---
number: 011
title: Auth própria (arctic + jose), sessão em cookie stateless, Permissões em tabela
date: 2026-07-02
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O [ADR-0006](./0006-panel-auth-google-oauth-invite-allowlist.md) fixou *o quê* da autenticação (Google OAuth, allowlist por Convite em `users`, sessão própria em cookie httpOnly, sem tabela de token) e o [ADR-0007](./0007-per-user-permission-list-no-roles.md) fixou o modelo de autorização (lista de Permissões por Usuário, forma entidade × ação, CRUD explícito, sem papéis). Ficaram em aberto três decisões de implementação: qual biblioteca de auth usar em Next 16 / React 19, como exatamente manter a sessão, e onde armazenar as Permissões.

Duas forças pesaram. Primeiro, o Auth.js v5 tinha histórico de instabilidade sobre Next 16 / React 19, e seu maior valor (adapter de banco, gestão de sessão) seria peso morto se a sessão fosse gerida pelo próprio app, como o ADR-0006 pede. Segundo, cogitou-se adicionar magic links ao painel — o que reintroduziria o token de e-mail que o ADR-0006 rejeitou; essa possibilidade foi **descartada**, mantendo Google como único método.

## Decisão

- **Biblioteca de auth = implementação própria: `arctic` (fluxo OAuth2 do Google, com `state`/PKCE) + `jose` (assinatura/verificação do cookie de sessão).** Sem Auth.js. Google é o único provedor; magic links estão fora.
- **Sessão = cookie httpOnly/secure/sameSite=lax, assinado e stateless**, carregando apenas o `id` do Usuário (`{ sub: id }`) — o e-mail vem sempre da linha recarregada, não do cookie. **Expiração deslizante de 30 dias**, renovada no `proxy.ts` (único ponto do caminho que lê o cookie e escreve a resposta sem a restrição de RSC do Next 16) e só quando a vida restante cai abaixo de 15 dias. Sem tabela de sessão nem de token.
- **`status` tem três estados:** `pending` (Convidado, nunca logou), `active` (logou, tem acesso) e `disabled` (revogado, registro preservado). A transição `pending→active` acontece no primeiro login; a revogação leva a `disabled`, que o login **não** ressuscita (marcar de volta para `pending` reativaria — por isso o estado terminal distinto). Apagar a linha é a revogação definitiva.
- **Revogação vale no próximo request:** a guarda autoritativa (layout do route group do admin) recarrega a linha `users` a cada acesso (confere existência e `status='active'`) e carrega as Permissões. Marcar como `disabled` ou apagar a linha derruba o acesso no próximo request, mesmo com cookie ainda íntegro.
- **Match de e-mail na allowlist:** comparação por `trim` + `lowercase`, exigindo a claim `email_verified === true` do Google. Peculiaridades do Gmail (pontos, `+alias`) **não** são normalizadas — o e-mail do Convite deve ser idêntico ao da conta Google.
- **Permissões armazenadas em tabela `user_permissions(user_id, entity, action)`** com `unique(user_id, entity, action)`; `entity` e `action` como `pgEnum`. Uma constante em TypeScript espelha o catálogo (8 alvos × 4 verbos = 32 Permissões) para descoberta e gating na UI.

## Rationale

Como a sessão é nossa (cookie assinado), o Auth.js não agrega — sobraria usá-lo só pelo handshake OAuth, envolto numa camada grande e com risco de compat. `arctic` cobre o fluxo Google inteiro em pouco código e sem framework; `jose` assina o cookie. O cookie stateless honra o "sem tabela de token" do ADR-0006; a revalidação da linha `users` por request recupera a revogação imediata que um cookie stateless sozinho não teria — a um custo de uma query por acesso ao admin, irrelevante na escala da igreja (e as Permissões já precisam ser carregadas de qualquer forma).

Tabela + `pgEnum` para Permissões dá integridade referencial e permite consultar "quem pode editar Boletim" — o que um `jsonb` em `users` esconderia. O `pgEnum` segue o estilo do repo (`member_status`, `moment_type`, `sacrament_type`).

## Considered Alternatives

- **Auth.js v5** (Google + adapter Drizzle). Rejeitado: sua gestão de sessão é redundante com a sessão própria do ADR-0006, e traz risco de compat com Next 16 sem ganho.
- **Permissões em `jsonb` na linha `users`.** Menos uma tabela, mas sem integridade nem consulta reversa. Rejeitado.
- **Magic links** como segundo método. Reintroduziriam o token de e-mail rejeitado no ADR-0006. Descartado nesta sessão.

## Consequências

- Entram as dependências `arctic`, `jose` e `zod` (validação). A guarda de rota se dá em três camadas: `proxy.ts` (checagem otimista de assinatura, sem banco), layout do admin (checagem autoritativa + carga de Permissões), Server Action (`can()` por ação).
- A revogação não é instantânea dentro de um request já em andamento — vale a partir do próximo. Aceito.
- Um convidado cujo e-mail difere em maiúsculas/acentos do e-mail Google é barrado silenciosamente; o remédio é cadastrar o e-mail correto, não afrouxar o match.
