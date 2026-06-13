---
number: 007
title: Autorização por lista de Permissões por Usuário, sem papéis
date: 2026-06-13
author: Victor Otávio Ferreira
status: accepted
---

## Context

Definido que o painel terá múltiplos **Usuários** autenticados (ver [ADR-0006](./0006-panel-auth-google-oauth-invite-allowlist.md)), é preciso decidir como modelar *o que cada um pode fazer*. As entidades sob gestão são as sete do domínio (Boletim, Artigo, Liturgia, Aviso, Música, Membro, Agenda), mais a própria gestão de Usuários.

A escolha clássica seria **RBAC** — papéis nomeados ("editor", "secretário", "administrador") com conjuntos de permissões, e Usuários recebendo papéis. A alternativa é atribuir **Permissões diretamente a cada Usuário**, sem a camada intermediária de papel.

## Decision

A autorização é uma **lista de Permissões por Usuário**, sem papéis. Uma **Permissão** tem a forma _entidade × ação_, com os quatro verbos CRUD **explícitos** (incluindo *read*): `read`, `create`, `update`, `delete` por entidade. Ver é uma Permissão própria — existe Usuário que só visualiza uma entidade sem poder alterá-la.

Sem a Permissão correspondente, a ação não aparece na UI nem é executável no Server Action. Não há papel nomeado: a alçada de um Usuário é exatamente a sua lista de Permissões, definida no **Convite** e ajustável depois.

## Rationale

Para a escala de uma igreja — um punhado de Usuários — papéis seriam uma indireção sem retorno. RBAC compensa quando há muitos usuários que se agrupam em perfis estáveis e repetidos; aqui cada pessoa tende a ter um recorte próprio ("a secretária mexe em Agenda e Avisos; o pastor, em Liturgia e Artigo"). Atribuir Permissões direto elimina a pergunta "que papel cobre exatamente isto?" e o risco de criar um papel por pessoa (RBAC degenerado).

Tornar o *read* explícito custa pouco (mais um verbo no catálogo) e habilita o caso real de um Usuário só-leitura, que um modelo com read implícito não expressaria.

O trade-off aceito: se um dia houver muitos Usuários com perfis idênticos, configurar Permissão por Permissão fica repetitivo — momento em que introduzir papéis (como agrupamento por cima das Permissões, não em vez delas) deve ser reconsiderado.

## Considered Alternatives

- **RBAC com papéis nomeados.** Rejeitado: indireção sem ganho na escala atual; tende a degenerar em um papel por pessoa.
- **Permissão por entidade inteira (sem distinguir verbo).** "Gere Boletins" cobriria criar/editar/excluir de uma vez — catálogo menor (~8 permissões). Rejeitado: não expressa Usuário só-leitura nem separar quem edita de quem exclui.
- **Permissão como string livre, sem catálogo fixo.** Flexível, mas sem integridade nem descoberta — fácil errar o nome e abrir brecha. Rejeitado.
