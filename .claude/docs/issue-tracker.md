# Issue tracker: Obsidian Vault

Issues for this repo live in the Obsidian vault at `~/obsidian/Projetos/IPB Jaraguá/1. Issues/`.

Use the `obsidian` CLI to interact with the vault. Always specify `vault=Obsidian` in every command.

## Conventions

- One file per issue: `~/obsidian/Projetos/IPB Jaraguá/1. Issues/IPJI<N>. Nome curto.md`
- IDs follow the pattern `IPJI<N>` where `<N>` is the next sequential integer
- To find the next ID: list existing issues and take `max(N) + 1`
- File name: max 50 characters (without extension), format `IPJI<N>. Nome curto.md`
- Conventions for all artifact types: `~/obsidian/Projetos/CLAUDE.md`

## Frontmatter

```yaml
---
id: IPJI<N>
type: task | idea | question
status: draft | todo | doing | done | rejected
title: "Título descritivo da issue"
created: YYYY-MM-DD
due_date: YYYY-MM-DD   # opcional
completed: YYYY-MM-DD  # opcional
tags:
  - projetos
  - issue
  - <atributo-type>
  - ipb-jaragua
---
```

## Status lifecycle

| Status | Meaning |
|---|---|
| `draft` | Quick capture. Needs refinement before becoming executable work. |
| `todo` | Enriched, ready to execute. |
| `doing` | In progress. |
| `done` | Completed — acceptance criteria met. |
| `rejected` | Discarded before becoming work. |

## When a skill says "publish to the issue tracker"

Use `obsidian create` to create the file (or write directly to the path):

```bash
obsidian create vault=Obsidian "path=Projetos/IPB Jaraguá/1. Issues/IPJI<N>. Nome curto.md" content="<frontmatter + body>"
```

## When a skill says "fetch the relevant ticket"

```bash
obsidian read vault=Obsidian "file=IPJI<N>. Nome curto"
```

Or search by content:

```bash
obsidian search vault=Obsidian "query=IPJI<N>" "path=Projetos/IPB Jaraguá/1. Issues"
```

## Listing open issues

```bash
obsidian files vault=Obsidian "folder=Projetos/IPB Jaraguá/1. Issues"
```
