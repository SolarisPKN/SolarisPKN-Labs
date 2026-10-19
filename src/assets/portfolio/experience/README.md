# Original logos for professional experience

These four user-supplied logos are committed as original WebP images. Keep their exact filenames and case:

- `Exo.webp` — EXO
- `SolarisPKN.webp` — SolarisPKN
- `LubricantesVilllars.webp` — Lubricantes Villars (three consecutive `l` characters after `Vi`)
- `TheZapas.webp` — TheZapas

The bilingual portfolio bundles the files with Astro/Vite through `import.meta.glob()` during the build. Each image receives an asset URL generated for the deployment. Cards also include accessible, visual-initials fallback markup if the image fails to load in the browser.

When images are changed, commit the updated WebP files and ensure the deployed site is rebuilt; changing only local images does not update production.
