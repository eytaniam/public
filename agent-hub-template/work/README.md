---
type: topic
status: active
updated: 2026-08-29
---

# Work

Active working files for in-flight projects live here — one folder per project, matching the wiki page in `projects/`. This is where new work is *born* (drafts, analysis, scratch), so that saving = it's already in the system; logging becomes `git commit`, not "remember to copy it over."

```
work/
└── <project>/            # e.g. my-project/ — matches projects/<project>.md
    ├── <working files>   # committed to GitHub (drafts, notes, memos)
    └── private/          # GITIGNORED — local only, never pushed
```

## The `private/` rule

Anything with **personal data, financial details, customer data, or other sensitive material** goes in `private/`. It is gitignored, so:

- It stays co-located with the project (easy to find, one folder).
- It never lands on GitHub, satisfying the sensitive-content rules in [[AGENTS]].
- It does **not** sync to mobile / cloud agents (those work from GitHub) and is **not** backed up by GitHub — back it up separately. Only local tools with filesystem access see `private/`.

When in doubt, put it in `private/` and commit a summary or pointer to the project page instead. Promote a file out of `private/` only after confirming it has no sensitive content.

## Relationship to the rest of the hub

- `work/<project>/` = the raw files you're actively editing.
- `projects/<project>.md` = the distilled current state (the wiki page).
- `log/` = what happened, when, and why.
- `docs/` = finished, shareable artifacts.
