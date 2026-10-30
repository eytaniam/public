# Agent Hub Template

A Markdown wiki for sharing project context across Claude Code, Codex, Cursor, and other tools with file access. Agents read relevant notes before a task and save decisions and outputs afterward. You can browse the same files in Obsidian or GitHub.

## Quick start

1. Download this repository using GitHub's **Code → Download ZIP**, then move just `agent-hub-template/` into a new folder for your hub. A normal clone includes the rest of the public writing repository too.
2. Read `AGENTS.md` and adapt its conventions and sensitive-content rules to your needs. Remove the placeholder README files in the content folders when you add real pages.
3. Inside your new hub folder, run `git init`. Enable the page-size hook with `chmod +x .githooks/pre-commit` and `git config core.hooksPath .githooks`. Repeat the hook setup in each new clone.
4. Check that `CLAUDE.md` points to `AGENTS.md`. Downloads or platforms that don't preserve symlinks may leave a plain file containing only `AGENTS.md`; replace that with a symlink or a copy of the instructions kept in sync. Codex and Cursor use the root `AGENTS.md` directly.
5. Review the files, make your first commit, and push to your own GitHub repository. Choose its visibility deliberately. Tools need authorized access to read it.
6. Write your first project page in `projects/` and link it from `HOME.md`.

## Use the hub from other project folders

The repo's instructions apply when you work inside it. To let agents find it from other projects, add this pointer to each tool's global instructions. Replace the example path with your hub's absolute path:

```text
My agent hub lives at /Users/<you>/agent-hub. When a task touches an ongoing
project, a prior decision, or anything worth remembering across sessions,
read AGENTS.md there and follow it: start from HOME.md, then write back at
the end of meaningful work. Ask before committing and pushing hub changes.
```

- **Claude Code:** add the pointer to `~/.claude/CLAUDE.md`. Project memory alone doesn't make the pointer available across projects.
- **Codex:** add it to `~/.codex/AGENTS.md` (or the global `AGENTS.md` in your configured Codex home).
- **Cursor:** paste it into global User Rules in settings. A project rule in `.cursor/rules/` only covers that project.

Preserve existing instructions and review global-file edits before saving them.

## What's included

- `AGENTS.md`: reading and writing instructions, document conventions, and sensitive-content rules.
- `HOME.md`: an index of projects and topics, with about ten recent log entries.
- `projects/` and `topics/`: short pages linked with `[[wiki-links]]`. Use unique filenames so links resolve without full paths.
- `docs/`, `work/`, `log/`, and `inbox/`: finished documents, working files, dated history, and notes waiting to be filed.
- `hub-log`: the write-back skill, included in `.claude/skills/`, `.agents/skills/`, and `.cursor/skills/`. Ask an agent to “log this to the hub.” Check that it actually saves the notes.
- Librarian instructions in `.claude/agents/librarian.md` and `.codex/agents/librarian.toml`: ask an agent to “maintain the hub” to file notes, fix links, shorten pages, and flag stale projects.
- `.githooks/pre-commit`: rejects staged project or topic pages over 150 lines, including when the working copy differs from the staged version.

Project facts use five labels: `Current as of`, `Decision`, `Open question as of`, `Historical note`, and `Needs verification`. Superseded decisions get an end date and a link to their replacement. Verify current-state facts older than 30 days before using them.

Both the write-back skill and librarian ask before committing and pushing unless already authorized. They stage only the task's files.

## Working with sensitive files

Put sensitive working files in `work/<project>/private/`. The `.gitignore` excludes these folders from the repo. This doesn't prevent local agents from reading them, and it doesn't provide a backup. Check the staged diff before committing.

A private repo doesn't imply that a GitHub Pages site will also be private. Read the notes through the repo itself.

## Keeping it useful

Keep `AGENTS.md` and `HOME.md` short: agents read them whenever they consult the hub. Project-specific instructions belong on the relevant page. Token use depends on those entry files and the pages a task needs; the hook limits individual page size, not how much an agent reads.

A chat tool without repo write access can draft a log entry for you to place in `inbox/`. An agent with file access can then file it.

Start with one project and check whether the saved notes help the next session. The template includes no dashboards or scheduled jobs. Dated changes are in [CHANGELOG.md](CHANGELOG.md).
