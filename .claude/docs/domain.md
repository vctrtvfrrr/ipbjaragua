# Domain Docs

How the engineering skills should consume this repo's domain documentation.

## Before exploring, read these

- **`README.md`** lives in the Obsidian vault at `~/obsidian/Projetos/IPB Jaraguá/README.md` — read it with:
  ```bash
  obsidian read vault=Obsidian "path=Projetos/IPB Jaraguá/README.md"
  ```
- **ADRs** live in `~/obsidian/Projetos/IPB Jaraguá/2. ADRs/` — list them with:
  ```bash
  obsidian files vault=Obsidian "folder=Projetos/IPB Jaraguá/2. ADRs"
  ```
  Read an ADR by file name: `obsidian read vault=Obsidian "file=IPJA<N>. Nome"`

If these files don't exist yet, proceed silently.

## Layout

Single-context repo. One `README.md` covers the entire domain.

```
~/obsidian/Projetos/IPB Jaraguá/
├── README.md         ← domain model, ubiquitous language, entity reference
└── 2. ADRs/
    ├── IPJA1. ...md
    └── IPJA2. ...md
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `README.md`. Don't drift to synonyms.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly:

> _Contradicts IPJA3 (union discriminada para tipos de momento) — but worth reopening because…_
