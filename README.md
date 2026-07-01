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

- `gov-ai-deck.html` - HTML version of the Governing AI deck.
- `generate-index.mjs` - local script that rebuilds the searchable index.
- `index.html` - generated menu page for the repo.
- `pdfs/` - generated PDF downloads for indexed docs.
- `_config.yml` - GitHub Pages/Jekyll configuration.
