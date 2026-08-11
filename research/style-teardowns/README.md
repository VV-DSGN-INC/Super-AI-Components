# Style teardowns

Measured visual-system teardowns of competitor/reference products — captured live from each product's running UI (computed styles, CSS custom properties), not eyeballed.

## 2026-08-11 — Ten-product teardown

OpenAI Platform · Claude Console · Twenty · Evernote · Monday · Pipedrive · Linear · Intercom · ElevenLabs · Manus. Light + dark color tokens, numeric tokens (radius, spacing, type, borders, shadows, control sizes), and token naming conventions.

- [2026-08-11-style-teardown.html](2026-08-11-style-teardown.html) — the visual page (swatches, spec cards, rebuilt mini-specimens, naming table). Deployed publicly at **https://style-teardown.vercel.app** (Vercel project `style-teardown`; redeploy by copying this file to `index.html` and running `vercel deploy --prod` in its folder).
- [2026-08-11-extraction-notes.md](2026-08-11-extraction-notes.md) — raw extraction notes per product.
- Full write-up with paste-able `[data-theme="try-*"]` blocks keyed to our `globals.css` semantic tokens: [docs/superpowers/specs/2026-08-11-product-style-token-research.md](2026-08-11-product-style-token-research.md).

## 2026-08-11 — App shell taxonomy (conceptual)

Classification of shell layouts across the same products + Asana: two independent axes (chrome layout × surface depth), nine archetypes with CSS wireframes, secondary parameters (sidebar finish, header ownership, record presentation, nav paradigm), measured sheet recipes, and the `data-shell` mapping for our system.

- [2026-08-11-shell-taxonomy.html](2026-08-11-shell-taxonomy.html) — the visual page, deployed at **https://style-teardown.vercel.app/shells** (same Vercel project, `shells.html` + `cleanUrls`).
- Write-up: [docs/superpowers/specs/2026-08-11-app-shell-taxonomy.md](2026-08-11-app-shell-taxonomy.md).
