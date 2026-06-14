---
number: 006
title: Autenticação do painel via Google OAuth com allowlist por Convite
date: 2026-06-13
author: Victor Otávio Ferreira
status: accepted
---

## Context

O painel administrativo precisa autenticar os **Usuários** que cadastram e editam o conteúdo do site — pessoas da igreja, não desenvolvedores. Até aqui o app não tinha nenhuma autenticação: o site é 100% leitura pública.

O [ADR-0001](./0001-sqlite-drizzle-self-hosted.md) escolheu SQLite self-hosted justificando, entre outras coisas, "zero serviço externo, zero ops de banco". Introduzir autenticação coloca esse princípio em xeque: ou se mantém tudo dentro do app (sessão e senha caseiras), ou se aceita um provedor de identidade externo.

Duas forças pesaram contra o caminho caseiro: guardar e rotacionar senhas com segurança (hashing, reset, vazamento) é responsabilidade que ninguém quer manter numa igreja; e as pessoas que vão operar o painel já têm conta Google. O risco do caminho externo é conhecido: **OAuth autentica qualquer pessoa com conta Google** — autenticar não pode ser o mesmo que autorizar a entrar no painel.

## Decision

O **Usuário** autentica via **Google OAuth**, mas o acesso ao painel é restrito a uma **allowlist** mantida no próprio banco:

- A tabela `users` é a allowlist. Só e-mails presentes nela conseguem entrar; autenticar no Google sem linha correspondente resulta em acesso negado.
- O acesso de um novo Usuário nasce de um **Convite**: um Usuário com permissão cria a linha em `users` em estado _pendente_, já com as **Permissões** definidas, e um e-mail de convite é enviado ao Gmail do convidado. O primeiro login Google com e-mail igual ao da linha pendente a ativa. Não há tabela de convites nem token: o Google já prova o controle do e-mail, então a allowlist por e-mail basta.
- O **primeiro Usuário** é semeado manualmente no banco (não há auto-cadastro).
- A sessão é mantida pelo app (cookie httpOnly); o Google é usado só para a verificação de identidade no login.

## Rationale

Delegar a verificação de senha ao Google elimina toda a superfície de risco de credenciais (hashing, reset, vazamento) sem custo de servidor de auth, e encaixa no público (já têm Gmail). A allowlist no banco resolve o risco central do OAuth — autenticar ≠ autorizar: o Google diz _quem é_, a tabela `users` diz _se pode entrar_.

Modelar o Convite como linha pendente em `users` (em vez de tabela `invites` com token) é a opção mais enxuta que ainda é correta: como o OAuth do Google já comprova posse do e-mail, um token de convite não acrescentaria segurança — só estado a manter. As Permissões já no Convite evitam um Usuário ativo porém inerte esperando configuração.

Esta decisão **reabre conscientemente o "zero serviço externo" do [ADR-0001](./0001-sqlite-drizzle-self-hosted.md)**: o banco segue local e self-hosted, mas o login passa a depender do Google, e o envio de Convites passa a depender de SMTP. É uma dependência externa em runtime que aquele ADR evitava — aceita aqui porque recai sobre o login/convite (degradação tolerável: se o Google ou o SMTP caem, o site público segue no ar; só o painel é afetado), não sobre a leitura do conteúdo.

## Considered Alternatives

- **Sessão e senha caseiras em SQLite** (email+senha, hash scrypt/argon2, tabela `sessions`). Coerente com o "zero externo" do ADR-0001 e sem dependência de runtime, mas joga a guarda de senhas para cima de uma operação amadora. Rejeitado pelo risco de credenciais.
- **BaaS de auth (Clerk/Auth0).** Tela de login pronta e multi-provedor, mas é serviço pago com vendor lock-in e cota — contradiz o espírito self-hosted mais fundo que o OAuth direto. Rejeitado.
- **Tabela `invites` com token e validade.** Cerimônia de "clicar no link para ativar" antes do OAuth. Rejeitado: o Google já prova posse do e-mail, então o token só adiciona estado sem ganho de segurança.

## Consequences

- Entram duas dependências externas em runtime, ausentes no ADR-0001: **Google OAuth** (login) e **SMTP** (envio de Convite). Ambas afetam só o painel, não o site público.
- É preciso registrar credenciais OAuth no Google Cloud (client id/secret) e configurá-las como variáveis de ambiente no servidor.
- Acesso é revogado removendo (ou marcando) a linha em `users`; não há fluxo no Google a desfazer.
- Um e-mail convidado que nunca faz login permanece como linha pendente — estado normal, não erro.
