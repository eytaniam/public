# Agent Hub Template

A git repo that acts as shared long-term memory across every AI agent you use — Claude Code, Codex, Cursor, whatever else — so nothing you learn in one session is lost, nothing is siloed to one tool, and you can reach it from your phone, not just your laptop.

This folder is a working skeleton, not a hypothetical — it's the actual structure behind a real setup. Clone it, delete the placeholder `README.md` files inside each folder, and start writing.

## The problem this solves

Every AI agent starts each session with a blank memory. Use more than one tool, or work from more than one machine, and none of them know what the others did — you re-explain context constantly, and nothing carries forward. This isn't an app or a service fixing that; it's just a folder of markdown files, structured like a wiki, in a GitHub repo, plus a small set of conventions every agent is told to follow.

## Quick start

1. **Get a local copy of just this folder, as its own repo.** This folder lives inside a bigger repo, so a plain `git clone` will pull in more than you want. Easiest path: on GitHub, use the **Code → Download ZIP** button, unzip it, and move the `agent-hub-template/` folder out to wherever you want your new hub to live. Then, inside that folder: `git init && git add -A && git commit -m "start from agent-hub-template"`. (If you're comfortable with git, `git subtree`/sparse-checkout gets you the same result while preserving history — not necessary for a fresh start.)
2. **Read `AGENTS.md`** — that's the actual contract: how agents read the wiki, how they write back to it, and the freshness convention that keeps facts from silently going stale. Adjust the wording to your own voice, but keep the mechanics.
3. **Wire your tools to auto-load it.** Claude Code looks for `CLAUDE.md` at repo root — already symlinked to `AGENTS.md` here. Codex (and the emerging cross-tool convention several other agents are adopting) looks for `AGENTS.md` directly. For a tool that doesn't auto-discover either name (Cursor, at time of writing), add a small stub file in that tool's own config location that just points back to `AGENTS.md`.
4. **Enable the page-size hook, once per clone:** `git config core.hooksPath .githooks` — see "Keeping agents disciplined" below for what it does.
5. **Push to a GitHub repo.** This is what makes it reachable from Claude on mobile/web, Codex cloud, or any other GitHub-aware agent mode — not just your local machine.
6. **Write your first project page** in `projects/`, list it in `HOME.md`, and start using the read/write protocol from `AGENTS.md` for real work.

## How it works, briefly

- **`HOME.md`** is the index — the one thing every agent reads first.
- **Pages are short and cross-linked** with `[[wiki-links]]` (Obsidian-compatible, if you want a visual browser). A link resolves to a unique filename anywhere in the repo, so an agent follows only the threads relevant to its task instead of reading everything.
- **Two protocols, followed by every tool:** read `HOME.md` → follow only relevant links → never bulk-read the repo. And at the end of a task: log it to `log/`, update the relevant `projects/` page, link liberally, commit and push.
- **Freshness labels, not just a page date.** Facts carry their own dated label (`Current as of`, `Decision`, `Open question`, `Historical note`), and anything superseded gets closed with an end date and a pointer to what replaced it — so "is this still true?" is something an agent can resolve by reading the label, not by guessing.
- **`private/` folders are gitignored** everywhere they appear. Anything with personal, financial, or otherwise sensitive content goes there — it never reaches GitHub, so it never reaches mobile or cloud agents either.
- **A librarian role** (see `.claude/agents/librarian.md` / `.codex/agents/librarian.toml`) does periodic anti-entropy: fixing broken links, filing the inbox, splitting overgrown pages, refreshing the index, flagging stale projects. Any agent can be asked to "maintain the hub."

Full mechanics, exact conventions, and the sensitive-content rules live in [`AGENTS.md`](./AGENTS.md) — that file is the source of truth, this README is the tour.

## Keeping agents disciplined

"The agent will follow the rules" isn't a control, it's a hope — a written protocol only holds if something actually enforces it. Here's what does, ranked by how much you can trust it:

1. **There's no bulk-read affordance in the first place.** Reads go through individual file tools (`Read`/`Grep`/`Glob`), one link at a time — there's no "dump the whole wiki" script or skill. Don't add one later "for efficiency"; that's the single easiest way to undo this.
2. **A stale or thin `HOME.md` is the actual root cause of over-reading.** An agent doesn't ignore "don't bulk-read" out of disobedience — it hedges and reads broadly when the index doesn't obviously answer "where do I look." Keeping `HOME.md` accurate is the load-bearing discipline mechanism here, not routine hygiene.
3. **The ~150-line page cap is mechanical, not aspirational.** A pre-commit hook (`.githooks/pre-commit`) blocks committing any `projects/*.md` or `topics/*.md` over the limit — oversized pages can't get committed silently and discovered three months later at 800 lines. Enable it once per clone with `git config core.hooksPath .githooks`.
4. **Runtime enforcement of read behavior is the next level up, if you ever need it.** Claude Code (and similar tools) support hooks that intercept tool calls before they run — one scoped to this repo's path could warn or block on a glob that looks like a true bulk-read, or just count files read per turn and flag a session that blows past a threshold. Worth building only if you actually observe bulk-read behavior in practice — a hook you don't need yet is complexity with no payoff.
5. **Make cost visible after the fact.** Have the write protocol's log entry note roughly how many pages a task touched. Not enforcement on its own, but it turns "is this staying disciplined" into something the librarian's periodic pass can check and flag, the same way it already flags stale projects.

## What this costs you

Roughly nothing to run (it's markdown + git), but it isn't literally free in tokens. A task following the reading protocol pays for `AGENTS.md` + `HOME.md` once (a few thousand tokens, depending on how big yours grows) plus whatever handful of linked pages the task actually needs (each capped at ~150 lines by convention). That's the whole point of "don't bulk-read the repo" — the cost stays roughly constant as the wiki grows, because a task always touches the same small slice of it, not the whole thing. Prompt caching (where your tool supports it) makes repeat reads within a session close to free.

## Caveats worth knowing before you rely on this

- **It only works if the write step actually happens.** The log-then-commit habit at the end of every session is what keeps the hub current — nothing enforces it automatically. Worth having your agent nag itself to do it.
- **Not every tool can write back equally well.** Anything with real git/file access can fully participate. A chat-only tool with no GitHub connection can still *read* the wiki if you paste in `AGENTS.md` plus a project page, but it can't log its own work back — that write has to come from a tool that can push.
- **Symlinks (`CLAUDE.md → AGENTS.md`) are fine on GitHub/macOS/Linux, less reliable on Windows** unless `core.symlinks` is configured — there, a plain duplicate file kept in sync is the safer fallback.
- **Start small.** One real project page and the logging habit matter more than a fully fleshed-out folder tree with nothing in it.
