# Auditoría de rescate / Recovery audit — 2026-10-19

## Incidente

El despliegue de `/es/arquitectura/` y `/en/arquitectura/` servía el diagrama Mermaid histórico de agosto. El catálogo `/projects/` mostraba solo 4 proyectos. El trabajo de octubre sobre arquitectura y catálogo quedó en el **PR #6 (draft)**, rama `feat/labs-catalog-core-derived-external-20261013`, pero **no había sido fusionado con `main`**.

Las mejoras de octubre de los PR #7–11 (portfolio profesional, 4 logos, mapa de conocimientos de 192 nodos con descripciones ES/EN) estaban en `main`. No hay evidencia en GitHub de que esos PR hayan borrado el código de arquitectura: este estaba pendiente en otra rama. El estado de archivos locales sin commit no está incluido en esta auditoría remota.

## Alcance de rescate verificado

| Área | `main` antes del rescate | Recuperación |
|---|---|---|
| `arquitectura.astro` | Mermaid antiguo estático | 3 vistas SVG interactivas: Dentro de Labs, Ecosistema, Planificado |
| Nodos del explorador | sin selección detallada | búsqueda, filtros, inspector, fuentes y relaciones, zoom y desplazamiento |
| Proyectos registrados | 4 | 18 revisados y públicos |
| Catálogo | solo proyectos existentes | 14 fichas nuevas (42 archivos: metadatos, narrativas ES/EN) |
| Estadísticas | ID por nombre de carpeta | uso de `statsId` con valor por defecto y SEO bilingüe |
| Protección frente a regresión | ninguna específica | pruebas Node.js de catálogo y arquitectura, Astro check y build |
| Portfolio | mejoras PR #7–11 | **preservadas**: la rama se creó desde `main` actual |

## Recuperado directamente de PR #6

- `src/components/Architecture/ArchitectureExplorer.astro`
- `src/components/Architecture/ArchitectureMetrics.astro`
- `src/scripts/architecture-explorer.js`
- `src/utils/architecture-map.js`
- `scripts/architecture-map.test.js`
- `src/pages/[lang]/arquitectura.astro`
- `src/locales/{es,en}/arquitectura.json`
- 14 subcarpetas de `src/content/projects/` con `project.json`, `index-es.mdx`, `index-en.mdx`
- `docs/project-catalog.md` y `scripts/project-catalog.test.js`

Las fichas de los 4 proyectos preexistentes no fueron sobreescritas. Los modelos mantienen la diferencia entre relación documentada, agrupación por catálogo y posible arquitectura futura. Una cifra en los gráficos representa registros/estados del repositorio; **no** se presenta como uptime en vivo.

## Fuera del despliegue: prototipo de cuentas

En PR #6 también hay código en `src/auth/`, `migrations/`, `src/scripts/account.js`, `src/scripts/community.js`, `src/pages/[lang]/mi-cuenta.astro`, `src/worker.js` y `wrangler.jsonc`. **Es un prototipo de identidad no aprobado para producción**.

Este rescate **no** lo copia, no crea bindings D1 ni secretos y no habilita OAuth, sesiones, comentarios o registro público. El PR #6 original permanece disponible para una auditoría de seguridad y pruebas de integración independientes.

Tampoco se incluyen los cambios de comentarios de blog y acciones de favoritos/seguimiento que dependen del sistema de cuentas no activado.

## Prevención

El workflow `.github/workflows/restore-architecture-catalog.yml` comprueba:
- catálogo público bilingüe con una línea base de 18 proyectos;
- coherencia de las categorías Core / Derived / External;
- modelo de arquitectura y relaciones documentadas, con separación de lo planificado;
- diagnósticos y compilación Astro, manteniendo el resto del sitio.

**Regla de integración:** los futuros cambios de sitio requieren confirmar que las ramas draft relacionadas no contienen mejoras aún fuera de `main` y revisar la ejecución completa de los checks antes del merge.

## Verificación de producción

Tras aprobar CI e integrar el PR, comprobar el HTML de `/es/arquitectura/` y `/en/arquitectura/` (tres vistas) y los tres listados de proyectos por categoría. Actualizar despliegue de Cloudflare si no se dispara solo. Las versiones antiguas cacheadas no deben usarse como única evidencia.

## Origen

- PR de recuperación: #12.
- PR de origen: #6.
- Mejoras de portfolio preservadas: #7, #8, #9, #10 y #11.
