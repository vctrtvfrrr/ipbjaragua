# Issue tracker: Gitea

Issues for this repo live in **Gitea** at `https://git.codelab.tec.br/codelab/ipbjaragua`. Skills read and write them through the [`tea`](https://gitea.com/gitea/tea) CLI, which is already authenticated against `git.codelab.tec.br` (login `vctrtvfrrr`, set as default).

When run from inside the repo, `tea` discovers the repo from the git remote, so `--repo` is optional. Pass `--repo codelab/ipbjaragua` explicitly when running from elsewhere.

## Commands

```bash
# List / read
tea issues list                                   # open issues
tea issues list --state all                       # include closed
tea issues list --labels needs-triage             # filter by label
tea issues <index>                                # show one issue in detail
tea issues <index> --comments                     # include comments

# Create
tea issues create --title "..." --description "..." --labels ready-for-agent
tea issues create -t "..." -d "..." -L needs-triage -m "Boletim Digital"

# Edit (labels, title, body, milestone, assignees)
tea issues edit <index> --add-labels ready-for-agent --remove-labels needs-triage
tea issues edit <index> --title "..." --description "..."

# Comment
tea comment <index> "comment body"

# State
tea issues close <index>
tea issues reopen <index>
```

`tea` supports `--output json` (and `csv`/`tsv`/`yaml`) on most read commands when a skill needs to parse results programmatically.

## When a skill says "publish to the issue tracker"

Run `tea issues create` with a title, a markdown description, and the appropriate triage label (see `triage-labels.md`). Assign the milestone if the work belongs to one.

## When a skill says "fetch the relevant ticket"

Run `tea issues <index>` (add `--comments` for the conversation history). The user will normally pass the issue index directly.

## Conventions

- Titles are descriptive imperative phrases, in Portuguese (BR).
- Triage state is expressed via labels — see `triage-labels.md`.
- Group related work under a Gitea milestone when one exists.
