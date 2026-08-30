# Public

Public repo for slides, markdown docs, and HTML presentation docs.

This repo is intended to publish through GitHub Pages with Jekyll from the
`main` branch and the repository root.

## How this is organized

- Add `.html` presentation files anywhere in the repo.
- Add `.md` docs anywhere in the repo.
- Run the index generator after adding or renaming files:

```bash
node generate-index.mjs
```

That rewrites `index.html` with a searchable menu of the repo contents and
refreshes downloadable PDFs in `pdfs/`.

## GitHub Pages

In GitHub, use `Settings` -> `Pages`:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

The site should publish at:

https://eytaniam.github.io/public/

## Current files

- `writing/` - published articles (Jekyll builds each `.md` with front matter into an `.html` page at the same path; the raw `.md` is never served, see `_layouts/article.html`).
- `decks/gov-ai-deck.html` - HTML version of the Governing AI deck.
- `gov-ai-deck.html` - a redirect stub, not content, for the deck's old root-level path. Marked `<!-- generated-redirect: do-not-index -->` so `generate-index.mjs` skips it; add the same marker to any future move-redirect.
- `agent-hub-template/` - a clonable git-repo skeleton, not site content. Excluded from both the Jekyll build (`_config.yml`'s `exclude:`) and the search index (`generate-index.mjs`'s `DEFAULT_IGNORES`) -- update both if you rename or move it.
- `_layouts/article.html`, `assets/css/article.css` - the layout and styles every page under `writing/` gets automatically (breadcrumb, single title, real typography, copy-to-clipboard on code blocks). Applied via `_config.yml`'s `defaults:` scope on `writing/`, not per-file front matter.
- `generate-index.mjs` - local script that rebuilds the searchable index (filters, folder/date sort, PDF links).
- `index.html` - generated menu page for the repo.
- `pdfs/` - generated PDF downloads for indexed docs.
- `_config.yml` - GitHub Pages/Jekyll configuration.
