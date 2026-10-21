# Public bilingual CVs (English / Español)

The CVs published on SolarisPKN-Labs are a **two-page, editable-source, ATS-readable** summary of the public portfolio, not a separate source of truth.

| Site language | Download link | Public PDF |
| --- | --- | --- |
| English | `/en/portfolio/` | `/cv-en.pdf` |
| Español | `/es/portfolio/` | `/cv-es.pdf` |

- Both download buttons in `src/pages/[lang]/portfolio.astro` resolve to the same localized PDF through `cvDownloadUrl`.
- `public/cv.pdf` has been removed. Do not add references to the legacy address.
- Both include an explicit **Core Competencies (ATS) / Competencias clave (ATS)** section, selectable text, and working links.
- Neither PDF claims laboratory experience at EXO to be an academic certificate or expert accreditation.
- Full project listings, supporting evidence and more courses are on the bilingual public portfolio.
- Update the CV content by editing `scripts/generate-cvs.py` after validating changes against `src/locales/{en,es}/portfolio.json`, `src/locales/{en,es}/portfolioskills.json` and project descriptions.
- Run `python -m pip install reportlab==4.4.9`, install system `DejaVu Sans` fonts, then `python scripts/generate-cvs.py` to regenerate both PDFs locally. **Never commit bundled font binaries.**
- In GitHub Actions, the `Publish bilingual ATS CV PDFs` workflow can be started manually to regenerate and commit both files. It also checks they contain exactly two pages and the ATS heading.
- `node --test scripts/cv-downloads.test.js` checks the links and available assets; the `Bilingual CV download regression` workflow checks every relevant pull request.

Only contact information already deliberately published on the portfolio should appear in these downloadable public documents.
