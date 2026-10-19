# SolarisPKN-Labs — catálogo público / Public catalog

## Categorías / Categories

- **Core Labs:** proyectos desarrollados bajo la identidad **SolarisPKN**.
- **Derived Labs:** iniciativas y marcas propias nacidas del ecosistema, aunque no lleven SolarisPKN en el nombre (por ejemplo, Villars Informa).
- **External Labs:** pruebas, prototipos y ejercicios sobre plataformas externas (por ejemplo, Figma, Replit y GitHub Skills). La presencia de una marca externa no implica patrocinio ni autoría de su software.

## Fuente de datos / Source of truth

Cada proyecto publicado tiene un archivo `src/content/projects/<repository>/project.json` y contenido bilingüe `index-es.mdx` / `index-en.mdx`. La aplicación genera las páginas a partir de estos archivos en el build, sin importar automáticamente proyectos privados.

`statsId` es la clave estable que usa Labs para solicitar el JSON a `SolarisPKN-Stats/main/<statsId>/Stats.json`. No es una credencial ni una promesa de que haya métricas disponibles. Los datos faltantes se muestran como no disponibles; no se inventan valores.

## Política de visibilidad / Visibility policy

**Solo se incluyen repositorios públicos revisados.** No se añade `solaris-learning-hub` ni ninguna carpeta privada o runtime de IA. Los proyectos sin código funcional se marcan expresamente como iniciales o experimentales. Los enlaces a Replit/Figma son referencias de plataforma, no una declaración de operación en producción.

## Añadir un repositorio / Add a repository

1. Revisar que el repositorio sea público y no contenga secretos ni datos personales.
2. Clasificar por identidad y origen, no únicamente por el lenguaje de programación.
3. Crear los tres archivos del proyecto y describir solo funciones verificadas.
4. Definir `statsId` con el ID que usa SolarisPKN-Stats, en minúsculas.
5. Ejecutar `npm run test:catalog`, `npm run check` y `npm run build`.
6. Integrar los cambios después de revisar el resultado de CI y los enlaces públicos.

La recolección de métricas se mantiene en SolarisPKN-Stats. Labs solo consume su contrato público y no escribe en el repositorio de estadísticas.
