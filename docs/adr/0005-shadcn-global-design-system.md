---
number: 005
title: shadcn/ui as global design system foundation
date: 2026-06-12
author: Victor Otávio Ferreira
status: accepted
---

## Context

O projeto não tem sistema de design — a UI é construída com classes Tailwind ad-hoc. Duas necessidades emergiram juntas: (1) preparar um painel administrativo para gestão de conteúdo, que vai exigir primitivos interativos acessíveis (formulários, diálogos, tabelas, selects); (2) estabelecer uma camada de tokens coesa que unifique o site público e o admin.

O site público já tem identidade visual estabelecida: fontes PT Sans / PT Serif / PT Sans Narrow, `body` em serif, e `green-900` como cor de acento (headings, links, títulos de seção). Qualquer fundação de design precisa preservar essa identidade ou migrar para ela de forma controlada.

## Decision

- **shadcn/ui instalado globalmente**: tokens e utilitários em `app/globals.css` e `lib/utils.ts`; componentes gerados em `components/ui/`.
- **Tokens OKLCH no `globals.css`**: `--primary` mapeado para `green-900` → `oklch(25.3% 0.09 152)`.
- **`font-serif` removido do `<body>` global**: o layout global (`app/layout.tsx`) deixa de aplicar `font-serif` ao body. O site público restaura serif explicitamente em seu próprio layout wrapper ou nos elementos de conteúdo. O admin herda `font-sans` do shadcn sem sobrescrita.

## Rationale

shadcn fornece os primitivos Radix acessíveis que o admin vai exigir (Dialog, Select, Form com validação, Table) — construí-los corretamente do zero teria custo desproporcional. A instalação global evita duplicar a camada de tokens e permite que primitivos compartilhados (Button, Badge) sejam reutilizados no site público quando conveniente.

Mapear `--primary` para o verde já existente preserva a identidade do site sem redesign. A alternativa (tema neutro padrão do shadcn) abandonaria a identidade sem nenhum benefício.

Mover `font-serif` para fora do `body` global é a separação semântica correta: conteúdo editorial usa serif; interface de sistema usa sans. A migração é barata agora (6 componentes, 13 rotas) e cara depois.

## Considered Alternatives

- **shadcn escopado só ao admin**: isola os temas, mas bifurca a camada de tokens e dificulta o reuso de primitivos no site público. Rejeitado.
- **Tema neutro padrão do shadcn como `--primary`**: abandona a identidade visual verde sem ganho. Rejeitado.
- **Manter `font-serif` no `body` globalmente e sobrescrever no admin**: exige sobrescrita em cada componente do admin; frágil e inconsistente. Rejeitado.

## Consequences

- Todos os componentes do site público que dependem de `font-serif` herdado do `body` precisam recebê-lo explicitamente — migração necessária antes ou junto da instalação do shadcn.
- Botões e elementos com `variant="default"` no admin serão verde-escuro (o `--primary` mapeado). Para contextos neutros do admin pode ser necessário usar `variant="outline"` ou `variant="secondary"` em vez do default.
- `clsx` e `tailwind-merge` passam a ser dependências do projeto (utilitário `cn`).
- Componentes gerados pelo shadcn vivem em `components/ui/`; componentes de domínio continuam em `components/` (sem mistura).
