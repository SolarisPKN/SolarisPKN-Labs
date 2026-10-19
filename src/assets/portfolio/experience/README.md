# Employer logo assets

Place the original user-provided images in this directory:

- `Exo.webp` — EXO
- `SolarisPKN.webp` — SolarisPKN
- `LubricantesVilllars.webp` — Lubricantes Villars (original filename uses **three** `l` characters after `Vi`)

- `TheZapas.webp` — TheZapas

Until an image is committed, the portfolio uses the initials fallback for that company.

The bilingual portfolio loads available files through Vite `import.meta.glob()`. File lookup is case-sensitive in CI (Linux). Missing logos are handled without broken images. After adding or replacing an image in this folder, commit and deploy the website.
