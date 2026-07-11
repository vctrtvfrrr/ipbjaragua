---
number: 19
title: OpenAI para geração de meta descriptions (primeira dependência de IA externa)
date: 2026-07-11
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

A issue #32 pede gerar a `<meta name="description">` das páginas de **Artigo** e **Liturgia** a partir do próprio conteúdo — uma tarefa que só um modelo de linguagem resolve bem (resumir a mensagem central de um texto pastoral, no tom certo, em ~200 caracteres).

Isso colide com o ethos do projeto. Até aqui o app é deliberadamente enxuto e self-hosted: o estado vive num Postgres compartilhado no VPS ([ADR-0010](0010-postgres-shared-vps.md)), o container é magro ([ADR-0009](0009-codelab-deploy-stack-contract.md)), e a **única dependência externa de runtime é o Resend** (envio de e-mail). Não há GPU no VPS compartilhado, nem qualquer infraestrutura de IA.

Forças em jogo:

- A geração é **esporádica e manual** — acionada por botão no painel, por um operador, para um site de igreja. Não é um caminho de alto volume nem de baixa latência crítica.
- Hospedar um modelo próprio exigiria GPU e operação desproporcionais à tarefa.
- O conteúdo enviado ao provedor (corpo do Artigo, programação da Liturgia) é **material destinado à publicação** — embora possa ainda estar em rascunho no painel —, então o operador não deve usar a geração com dado sensível.

## Decisão

Usar a **API da OpenAI** (SDK oficial `openai`) como provedor de geração de texto, com quatro travas que contêm o acoplamento:

1. **Isolada num módulo único** `lib/ai.ts`, que expõe uma função de geração. Nenhum outro ponto do código conhece o provedor.
2. **Configuração por env:** `OPENAI_API_KEY` (obrigatória) e `OPENAI_MODEL` (default embutido, modelo classe "mini"). A chave entra no contrato do deploy stack ([ADR-0009](0009-codelab-deploy-stack-contract.md)).
3. **Acionamento sempre manual** (botão no painel), nunca no caminho de um save.
4. **Best-effort:** falha/timeout/cota da OpenAI retorna erro amigável no formulário e não afeta nenhuma operação local — salvar Artigo/Liturgia segue infalível.

## Rationale

- **Modelo hospedado seria infra desproporcional.** GPU, provisionamento e operação de um LLM próprio não se justificam para uma geração acionada a cliques, esporadicamente, numa igreja. OpenAI é o menor caminho até o resultado.
- **O lock-in fica contido por desenho.** Como todo o contato com o provedor vive em `lib/ai.ts` e o modelo é uma env, trocar de provedor (ou de modelo) é reescrever um módulo pequeno — não uma migração. Isso torna a escolha específica da OpenAI barata de reverter, apesar de a decisão macro (depender de IA externa) não ser.
- **A dependência externa nunca entra no caminho crítico.** Manter a geração manual e best-effort garante que o enfeite de SEO jamais possa travar o que importa (publicar conteúdo). É o mesmo princípio de degradação graciosa da [ADR-0018](0018-featured-image-bytes-on-disk-bind-mount.md).
- **Risco de privacidade delimitado.** Só deve trafegar conteúdo destinado à publicação, inclusive rascunhos ainda não salvos. O painel não deve usar a geração com dado sensível; se esse pressuposto mudar, enviar dados a um terceiro exige reavaliar esta decisão.
- **Custo desprezível.** Texto curto, gatilho manual, site pequeno — não justifica rate-limit nem cache nesta fase.

## Alternativas Consideradas

- **Modelo self-hosted (ex.: Llama/Ollama no VPS).** Rejeitado: sem GPU, e a operação de um modelo local é desproporcional a uma tarefa acionada a cliques. Reintroduziria exatamente o "excesso de infra" que a [ADR-0001](0001-sqlite-drizzle-self-hosted.md) recusou.
- **Outro provedor de API (Anthropic etc.).** Equivalente em capacidade para esta tarefa; a escolha da OpenAI é preferência, e a arquitetura (`lib/ai.ts` + env) isola o provedor de qualquer forma, mantendo a porta aberta.
- **Não usar IA — manter o texto escrito à mão.** É o status quo do `excerpt` do Artigo. A issue existe justamente para reduzir esse trabalho manual e cobrir a Liturgia, que hoje não tem descrição nenhuma.

## Consequências

- Nova env obrigatória (`OPENAI_API_KEY`) no contrato de deploy — sua ausência precisa falhar de forma clara, não silenciosa.
- Nova dependência npm (`openai`).
- Passa a existir uma chamada de rede a um terceiro no fluxo do painel; toda a robustez fica centralizada em `lib/ai.ts` e na server action (timeout curto, erro amigável, campo intacto).
- Se um segundo uso de IA surgir, esta decisão é o precedente a revisitar — o mesmo módulo `lib/ai.ts` deve ser o ponto de extensão.
