# October 2026 dependency security maintenance

This patch addresses dependencies identified in the October 22, 2026 audit:

- **sharp**: CVE-2026-96889, patched from 0.35.3 and Miniflare's nested 0.35.2 to 0.35.5.
- **Astro**: GHSA-26w7-cxv4-gfx2, update to the patched Astro 7 release.
- **DOMPurify, Vite, devalue, undici, SVGO** and other dependencies: refresh the lockfile with npm's security fixes.
- **Mermaid/KaTeX**: move to Mermaid 12.2.0+ for a patched KaTeX dependency. Verify live diagram interactions after deployment.
- **Node.js in CI**: use Node 22.23.4, the October 21 security release.
- **Content Security Policy**: remove `unsafe-eval` and set `object-src 'none'`.

To validate locally:

```sh
npm ci
npm audit --omit=dev --audit-level=high
npm run check
npm run build
```

No credentials belong in this repository. The site is generated statically, and these upgrades do not patch unrelated PHP or Next.js runtimes.

The CSP still allows `unsafe-inline` for compatibility. A later change should migrate inline scripts to nonces/hashes and narrow the `connect-src` allowlist, with browser regression tests before deployment.
