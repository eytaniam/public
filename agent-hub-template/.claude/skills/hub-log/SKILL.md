---
name: hub-log
description: Write a completed task's output and learnings into the agent hub wiki. Use whenever a meaningful piece of work finishes — "log this to the hub", "save this to the hub", "write this up" — or proactively at the end of any substantial task performed in or about this repo's subject matter.
---

# Log completed work to the hub

You are writing memory for future agents. Optimize for what the *next* agent (or the hub's owner, reading on a phone) needs to pick this work up cold.

1. **Create the log entry** at `log/YYYY-MM-DD-short-slug.md` (today's date, kebab-case slug) with frontmatter (`type: log`, `status: done`, `updated:`) and three sections:
   - **What happened** — the work done, in 2–5 sentences.
   - **Decisions** — each decision *with its why*. This is the highest-value content; don't skip the why.
   - **Outputs** — what was produced and where it lives (paths, PR links, doc links).
2. **Update the relevant `projects/` page**: refresh `updated:` and the "Current state" section to reflect the new present. Move anything now-historical out (the log entry holds it). Add the log entry under "Log entries".
3. **Link liberally**: first mention of any project/topic/page gets `[[wiki-link]]` treatment, including links to pages that don't exist yet.
4. **Check the sensitive-content rules in AGENTS.md** before writing: no personal, financial, or customer data — use pointers instead.
5. **Update HOME.md** recent-log list (keep ~10 newest).
6. **Commit and push**, after asking unless already told to push: stage only files belonging to this task, review the staged diff, then commit with `log: <slug>` and push. If you cannot push from where you are, write the entry anyway and say so; a session that can push, or the owner via `inbox/`, will carry it.
