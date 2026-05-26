# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the `status` field used in this repo's Obsidian issue tracker.

| Canonical role    | Status in our tracker | Meaning                                  |
|-------------------|-----------------------|------------------------------------------|
| `needs-triage`    | `draft`               | Maintainer needs to evaluate this issue  |
| `needs-info`      | `draft`               | Waiting on reporter — note reason in body |
| `ready-for-agent` | `todo`                | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `todo`                | Requires human implementation            |
| `wontfix`         | `rejected`            | Will not be actioned                     |

When a skill mentions a role (e.g. "mark as AFK-ready"), set the `status` frontmatter field to the corresponding value in the right column.

Note: `needs-triage` and `needs-info` both map to `draft`. When applying `needs-info`, add a note in the issue body explaining what information is needed.
