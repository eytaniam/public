---
type: topic
status: active
updated: 2026-10-30
---

# Agent Hub

Shared memory for every AI agent you use (Claude Code, Codex, Cursor, anything else that can read files and run git) and for you, browsing it on GitHub or in Obsidian. A wiki of small pages connected by `[[wiki-links]]`. Agents read it to load context cheaply and write back what they learn so the next agent starts from the current state.

This file is the contract. Keep it short: every agent loads it on every task. Rules that belong to one project or topic go on that page, with a one-line pointer from here.

## Map

- `HOME.md` — start here; index of everything
- `projects/` — one page per initiative; the distilled current state, not history
- `topics/` — cross-cutting concepts referenced by many projects
- `docs/` — finished artifacts: memos, specs, decision docs
- `work/` — active working files, `work/<project>/`. Sensitive files go in `work/<project>/private/` (gitignored). See `work/README.md`.
- `log/` — append-only journal of completed work, `YYYY-MM-DD-short-slug.md`
- `inbox/` — raw quick-capture drops for the librarian to file, including log entries drafted by tools that cannot push
- `.claude/skills/`, `.agents/skills/`, `.cursor/skills/` — the same skills for each tool; write-back is the `hub-log` skill
- `.claude/agents/`, `.codex/agents/` — the librarian
- `.githooks/` — the page-size pre-commit hook; enable once per clone with `git config core.hooksPath .githooks`

## Reading (start of a task)

1. Read `HOME.md`, then follow `[[links]]` only to pages relevant to the task. `[[name]]` resolves to `name.md`; filenames are unique repo-wide.
2. Do not bulk-read the repo. There is deliberately no "read everything" script or skill here; do not add one. If `HOME.md` is not a good enough index to answer "where do I look," fix the index.

## Writing (end of a task)

Start new project work in `work/<project>/`. Anything with personal data, financial details, customer data, or other sensitive material goes in `work/<project>/private/`.

After meaningful work:

1. **Log it**: `log/YYYY-MM-DD-short-slug.md` with what was done, decisions and why, what was produced and where it lives.
2. **Update the project page**: current state and decisions only; history lives in the log.
3. **Link** the first mention of any project, topic, or page with `[[...]]`. Links to pages that don't exist yet are fine.
4. **Update `HOME.md`** if you created a page. Keep its recent-log list to the newest ~10 entries.
5. **Commit and push** (`log: <what happened>`) after asking, unless already told to push. Stage only task files and review the staged diff. Pull before you start writing, not only before you push; other sessions write to this repo too.

## Freshness labels

`updated:` in frontmatter means the page changed that day, not that every statement is current. Label each `## Current state` bullet on project pages:

- `**Current as of YYYY-MM-DD:**` active facts, plans, direction
- `**Decision (YYYY-MM-DD):**` settled choices, with the reason. When superseded, close the range: `**Decision (2026-06-01 → 2026-08-10, superseded by [[new-page]]):**`
- `**Open question as of YYYY-MM-DD:**` still unresolved; include owner or next checkpoint
- `**Historical note (YYYY-MM-DD):**` context that should not drive current work
- `**Needs verification:**` possibly stale; verify before using

Close resolved items with an end date and `superseded by` link rather than deleting them. Treat current-state items older than 30 days as needing verification before presenting them as current.

## Where finished work goes

- Memos, specs, decision docs → `docs/<project>-<slug>.md` with frontmatter `type: doc`, `status: draft | final`, `updated:`. Link from the owning project page under **Artifacts** and from the log entry.
- A doc reviewed in a shared drive keeps its markdown source here with the drive link as `canonical:` in frontmatter, and says which copy is canonical.
- Slide decks, PDFs, large HTML prototypes stay in the drive or a local folder; the hub gets a pointer.
- A large documentation corpus gets a routing page here that says where to look, never a copy. The hub holds decisions and pointers; the thing itself stays at its source.

## Conventions

- Filenames: kebab-case, unique across the repo.
- Every page starts with frontmatter: `type` (project | topic | doc | log | inbox), `status`, `updated` (YYYY-MM-DD).
- `projects/` and `topics/` pages stay under 150 lines; the pre-commit hook in `.githooks/` enforces it. When a page grows past the limit, move history into a `log/` entry.
- Dates are absolute (`2026-07-20`), never relative.

## Sensitive-content rules (adapt to your situation, then treat as no exceptions)

- No raw personal, financial, or customer data in tracked files. Stay one notch abstracted ("a large customer," not the name), or write a pointer to where the material lives instead of the material.
- Anything that must contain the real thing goes in a `private/` folder (see `.gitignore`): excluded from git and not uploaded through this repo. Local agents may still have access.

## Pointers

- **Maintenance.** "Maintain the hub" means run the librarian duties in `.claude/agents/librarian.md`. Codex agents follow `.codex/agents/librarian.toml`, which carries the same text.
- **Other folders.** This file loads automatically only when the open folder is this repo. For every other folder, each tool needs a one-line global pointer to the hub; see the README.
