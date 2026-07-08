---
number: 17
title: IP do cliente vem de CF-Connecting-IP atrás da Cloudflare, não de X-Forwarded-For
date: 2026-07-08
author: Victor Otávio Ferreira
status: accepted
---

## Contexto

O **Cadastro Público** (`/members/register`) é a única superfície de escrita não-autenticada do sistema, e se protege por um rate-limit por IP (5 submissões/hora). O `requestIp()` da action lia o IP do visitante de `x-forwarded-for` (primeiro elemento) com fallback para `x-real-ip`.

A topologia de produção é encadeada:

```
Cliente → Cloudflare (orange, proxied) → Traefik (config padrão) → container
```

Dois fatos dessa cadeia quebram a leitura por `X-Forwarded-For`:

- **O Traefik reescreve os `X-Forwarded-*`.** Com a config padrão (`forwardedHeaders.insecure: false`, `trustedIPs` vazio), o Traefik não confia nesses headers vindos de fontes não listadas: ele descarta o `X-Forwarded-For`/`X-Real-Ip` que chegam e os reescreve a partir do IP da conexão TCP.
- **A conexão que o Traefik vê vem da Cloudflare, não do cliente.** Com o Cloudflare proxiando (orange), o IP de origem da conexão é o de um **edge/PoP da Cloudflare**. Resultado: o app acabava lendo o IP do edge, não o do visitante — o bucket de rate-limit virava efetivamente **por PoP**, compartilhado entre visitantes reais (que, numa igreja, saem quase todos do mesmo PoP), barrando cadastros legítimos.

## Decisão

Atrás da Cloudflare, o IP do cliente é lido de **`CF-Connecting-IP`**. O `requestIp()` prioriza esse header e mantém a cadeia anterior (`x-forwarded-for` → `x-real-ip`) apenas como fallback para dev/local, onde não há Cloudflare.

A confiabilidade de `CF-Connecting-IP` depende de uma garantia de infra, fora deste repo: **a origem só aceita tráfego da Cloudflare** (ingress restrito às faixas de IP da Cloudflare, no firewall do VPS ou no Traefik). Sem esse lockdown, uma requisição batendo direto na origem pode forjar `CF-Connecting-IP` — e, de quebra, contornar o WAF/DDoS da própria Cloudflare.

## Rationale

`CF-Connecting-IP` é injetado e **sobrescrito** pela Cloudflare a cada request (o valor que o cliente mande é ignorado), e **passa incólume pelo Traefik**, que só manipula os headers `X-Forwarded-*`/`X-Real-Ip`. Isso torna irrelevante a discussão de strip-vs-append do Traefik: em vez de depender de como cada salto trata o `X-Forwarded-For`, lê-se o header que a borda confiável garante. É o caminho canônico para identificar o cliente atrás da Cloudflare.

## Consequences

- A garantia é condicional ao **lockdown da origem às faixas da Cloudflare**. Esse é um requisito de infra que a revisão de segurança (#20) verifica; se um dia a origem ficar exposta, `CF-Connecting-IP` deixa de ser confiável.
- Se a borda mudar (sair da Cloudflare, ou entrar outro proxy antes dela), a fonte do IP precisa ser reavaliada — daí este registro.
- O fallback para `x-forwarded-for`/`x-real-ip` preserva o comportamento em dev/local e em testes, onde não há Cloudflare.
