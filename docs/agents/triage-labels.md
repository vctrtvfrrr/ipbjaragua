# Triage Labels

The skills speak in terms of five canonical triage roles. In this repo those roles map **1:1 to Gitea labels** that already exist on `codelab/ipbjaragua` — apply them with `tea issues edit <index> --add-labels <label>` (and `--remove-labels` for the previous one).

| Canonical role    | Gitea label       | Meaning                                  |
| ----------------- | ----------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`    | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`      | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent` | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human` | Requires human implementation            |
| `wontfix`         | `wontfix`         | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), apply the corresponding Gitea label from this table. The labels are mutually exclusive triage states — remove the old one when moving an issue to a new state.

```bash
# Move an issue from needs-triage to ready-for-agent
tea issues edit 4 --add-labels ready-for-agent --remove-labels needs-triage
```

These labels are managed in the Gitea repo itself (`tea labels`). If you add or rename a triage label there, update the right-hand column to match.
