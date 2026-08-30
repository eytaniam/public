---
type: topic
status: active
updated: 2026-08-29
---

# Agent Hub

Shared memory and working context for every AI agent you use — Claude Code, Codex, Cursor, or anything else that can read files and run git — and for you, browsing this repo directly on GitHub or in a wiki viewer like Obsidian.

This is a **wiki**: small pages connected by `[[wiki-links]]`. Agents read it to load context cheaply, and write back what they learn so the next agent starts from the current state instead of from zero.

## Map

- `HOME.md` — start here; index of everything
- `projects/` — one page per ongoing initiative; the **distilled current state** (not history)
- `topics/` — cross-cutting concepts referenced by many projects
- `docs/` — finished artifacts: memos, specs, decision docs (the polished outputs themselves)
- `work/` — active working files, one folder per project (`work/<project>/`); this is where new work is born. Sensitive files go in `work/<project>/private/` (gitignored, local-only). See `work/README.md`.
- `log/` — append-only journal of completed work; one file per entry, named `YYYY-MM-DD-short-slug.md`
- `inbox/` — raw quick-capture drops (e.g. from mobile); the librarian files these into the wiki
- `.claude/`, `.codex/` — per-tool config, pointing at the same shared conventions below. Add `.cursor/` or others the same way if you use them.
- `.githooks/` — pre-commit hook enforcing the page-size cap below. Run `git config core.hooksPath .githooks` once per clone to enable it.

## Reading protocol (start of any task)

1. Read `HOME.md`.
2. Follow `[[links]]` only to pages relevant to your task. A link `[[some-page]]` resolves to the file `some-page.md` wherever it lives in the repo — filenames are unique repo-wide, so a filename search always finds it.
3. Do **not** bulk-read the whole repo. The link graph exists so you don't have to. This only holds if `HOME.md` is actually good enough to answer "where do I look" without hedging — a stale or thin index is what pushes an agent toward reading broadly "to be safe." Treat keeping `HOME.md` accurate as the load-bearing discipline mechanism, not routine hygiene. There is deliberately no "read everything" script or skill in this repo — don't add one for convenience later.

## Writing protocol (end of any task)

**Start new project work in `work/<project>/`** (create the folder if needed) so it's captured from the first save. Put anything with personal data / customer data / financial details in `work/<project>/private/`.

When you complete meaningful work, before you finish:

1. **Log it.** Create `log/YYYY-MM-DD-short-slug.md`: what was done, key decisions and why, what was produced and where it lives.
2. **Update the project page.** Refresh status/decisions on the relevant `projects/` page. Keep it distilled — the log holds history; the project page holds the present.
3. **Link liberally.** Wrap the first mention of any project, topic, or page in `[[...]]`. A link to a page that doesn't exist yet is fine — it marks a page worth creating.
4. **Update `HOME.md`** if you created a new page.
5. **Commit and push** with a descriptive one-line message:
   `git add -A && git commit -m "log: <what happened>" && git push`

## Freshness protocol

`updated:` means "this page changed on this date." It does **not** prove every statement on the page is still current.

For live project pages, every `## Current state` bullet should carry a freshness label. Where a fact has a clear end — superseded, decided against, no longer true — close it with an end date and a pointer to what replaced it, instead of leaving only a start date for the reader to guess at:

- `**Current as of YYYY-MM-DD:**` for active facts, plans, or direction.
- `**Decision (YYYY-MM-DD):**` for settled choices, including the reason if known. If later superseded, close the range: `**Decision (2026-06-01 → 2026-08-10, superseded by [[new-page]]):**`.
- `**Open question as of YYYY-MM-DD:**` only for questions that are still actively unresolved; include the owner or next checkpoint when known. Once resolved, close it the same way or move it into a log entry.
- `**Historical note (YYYY-MM-DD):**` for context that should not drive current work — often what a closed `Decision` or `Open question` becomes.
- `**Needs verification:**` for uncertain or possibly stale information; agents must verify before using it.

A closed range (`start → end`) means: don't act on this as current, but it's kept for history — follow the `superseded by` link for what's true now. An open range (`start → present`, or the bare `YYYY-MM-DD` form) means: still active, but re-verify past 30 days.

When updating a page, close out resolved open questions and superseded decisions with an end date and a `superseded by` link rather than deleting them outright, or move them into a log entry if the page is getting long. If a current-state item is older than 30 days, or if newer logs/docs contradict it, treat it as stale and verify against more recent sources before presenting it as current.

## Conventions

- Filenames: kebab-case, unique across the entire repo (this is what makes `[[links]]` unambiguous).
- Every page starts with frontmatter: `type` (project | topic | log | inbox), `status`, `updated` (YYYY-MM-DD).
- Pages stay small (roughly under 150 lines). When a page grows past that, split a section into its own page and link to it. Enforced mechanically, not just aspirationally: a pre-commit hook blocks committing any `projects/*.md` or `topics/*.md` over the limit (`.githooks/pre-commit`). Run `git config core.hooksPath .githooks` once after cloning to enable it.
- Dates are always absolute (`2026-07-20`), never relative ("yesterday", "next week").

## Sensitive-content rules — adapt these to your own situation

- **No raw personal/financial/customer data** in tracked files. Stay one notch abstracted, or use a pointer to where the real material lives (local path, private doc) instead of the material itself.
- Anything that must contain the real thing goes in a `private/` folder (see `.gitignore`) — never committed, never synced to mobile/cloud agents.

## Maintenance — the librarian

The librarian role (see `.claude/agents/librarian.md`; Codex config follows the same duties at `.codex/agents/librarian.toml`) periodically:

- fixes broken or ambiguous `[[links]]`,
- files `inbox/` items into the right project/topic pages,
- distills bloated project pages, pushing history down into `log/`,
- refreshes the `HOME.md` index,
- flags projects with no activity in 30+ days as stale.

Any agent can be asked to "maintain the hub" — that means: do the librarian duties.
