# Changelog

Dated changes to this template, newest first. The [article](../writing/agent-hub-shared-memory.md) describes the current setup and links here for revision history.

## 2026-10-30

- Both setup paths explicitly cover enabling the page-size hook and checking staged content. All three hub-log skill copies stage only task files and review the staged diff.
- Both librarian configs explicitly ask before committing and pushing unless already authorized; stage only files from the maintenance pass.
- README summary includes all five freshness labels and the ask-first commit policy; clarifies that built-in tool memory does not automatically transfer between tools.
- The page-size hook checks staged content, including renamed pages, so partial staging cannot bypass the cap.
- Companion article setup prompts corrected for Claude's global instructions path and Cursor User Rules; from-scratch prompt now includes the ten-entry index cap and finished-document conventions.

## 2026-10-26

- `AGENTS.md` rewritten as the short form of the contract: the same mechanics, about a third shorter, with a new "Where finished work goes" section and a "Pointers" section. Rules that belong to one page now live on that page. Reason: this file is loaded by every agent on every task, so it is the one place where growth compounds.
- Commit step is ask-first ("commit and push after asking, unless already told to push"), and says to pull before writing. Reason: several tools and sessions write to one repo.
- Fifth freshness label, `Needs verification:`, added to the contract. It is what the 30-day rule turns a fact into.
- `doc` added to the frontmatter type list; `docs/README.md` gains the `canonical:` convention for docs reviewed in a shared drive.
- New `hub-log` skill in `.claude/skills/`, `.agents/skills/`, and `.cursor/skills/`: the writing protocol with a trigger ("log this to the hub", or proactively at the end of substantial work) and the log-entry shape spelled out.
- `inbox/README.md` documents the write path for tools that cannot push: draft a log entry, drop it in the inbox, the librarian files it.
- `HOME.md` recent-log list capped at the newest ~10 (was ~5 in the placeholder text, 50 in practice); both librarian configs updated to match.
- `.cursor/rules/agent-hub.mdc` removed. Cursor reads a root `AGENTS.md` on its own ([Cursor rules docs](https://cursor.com/docs/context/rules)), so the rule duplicated it.
- `README.md`: Cursor step corrected; the suggestion to use Claude Code's persistent memory instead of the global `CLAUDE.md` pointer removed (that memory is per project directory, not global); caveats updated for the skill, the inbox write path, and the GitHub Pages privacy trap; new "What this template deliberately leaves out" section.

## 2026-08-30

- First published version, alongside the post.
