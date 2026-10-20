# SolarisPKN-Labs

🇦🇷 Español | 🇺🇸 [English](README.md)

## Descripción General

SolarisPKN-Labs es el sitio web oficial de desarrollo del ecosistema SolarisPKN.

Actualmente el proyecto se encuentra en una etapa temprana de desarrollo y funciona como un espacio centralizado para presentar proyectos, experimentos, documentación técnica y futuros desarrollos.

Su objetivo principal es ofrecer una forma organizada y accesible de explorar el trabajo desarrollado bajo la marca SolarisPKN.

## Estado Actual

⚠️ Este proyecto se encuentra en desarrollo activo.

Actualmente SolarisPKN-Labs es principalmente un sitio web público y un proyecto de aprendizaje utilizado para:

* Aprender y experimentar con tecnologías web modernas.
* Construir un portfolio tecnológico personal.
* Centralizar futuros proyectos y documentación.
* Desarrollar la base para futuras funcionalidades e integraciones.

## Características

Características actuales:

* Sitio web público.
* Diseño adaptable (responsive).
* Estructura para presentación de proyectos.
* Navegación básica.
* Despliegue mediante Cloudflare Pages.
* Blog bilingüe con editor local guiado.

Características planificadas:

* Documentación técnica.
* Catálogo de proyectos.
* Sección de arquitectura.
* Integración con proyectos Open Source.
* Presentación de firmware y herramientas.
* Sistema de productos y licencias.

## Crear una publicación

En Windows, hacé doble clic en `abrir-editor-posts.cmd`. El archivo inicia un servidor efímero enlazado únicamente a `127.0.0.1` y abre una interfaz visual en el navegador.

El editor permite completar metadatos, español e inglés, Markdown, portada y galería. Valida nombres, tamaños y rutas, crea todos los archivos del blog y no sobrescribe publicaciones existentes. No usa autenticación porque no se expone a la red: vive y termina en tu propia PC.

También podés iniciarlo con:

```powershell
npm run post-editor
```

La herramienta de consola sigue disponible con `npm run create-post`.

## Objetivos

El objetivo a largo plazo de SolarisPKN-Labs es convertirse en un punto central para:

* Proyectos de desarrollo de software.
* Sistemas embebidos.
* Desarrollo con ESP32.
* Infraestructura y tecnologías cloud.
* Automatización.
* Documentación técnica.
* Iniciativas Open Source.

## Tecnologías

Tecnologías actuales:

* Astro
* HTML
* CSS
* JavaScript
* GitHub
* Cloudflare Pages

## Sitio Web

Sitio en producción:

https://labs.solarispkn.com.ar

## Repositorio

GitHub:

https://github.com/SolarisPKN

## Filosofía del Proyecto

SolarisPKN-Labs busca ser más que un portfolio.

El objetivo es documentar proyectos, experimentos, aprendizajes y soluciones técnicas mientras la propia plataforma evoluciona constantemente.

En pocas palabras:

Un proyecto diseñado para contener otros proyectos.

## Licencia

La licencia del proyecto será definida en futuras versiones.

## Analítica de visitas (GA4)

La etiqueta de Google Analytics 4 `G-66ZYMRXVCE` se incorpora en el layout compartido mediante un módulo de consentimiento básico. El identificador de medición es público y puede reemplazarse opcionalmente en compilación con `PUBLIC_GA_MEASUREMENT_ID`; **no** es un secreto de API.

- La etiqueta **no se descarga ni transmite datos** antes de que el visitante acepte. El rechazo no afecta al sitio.
- La elección se guarda localmente; en el pie de página se puede volver a configurar.
- Tras aceptar, Google recibe los datos directamente desde el navegador; no hay solicitudes ni escrituras adicionales en Cloudflare Workers, KV o D1.
- GA4 registra vistas automáticamente, también cuando Astro ClientRouter navega y modifica el historial. No enviamos `page_view` manualmente.
- En **Google Analytics → Administrar → Flujos de datos → Web → Medición optimizada → Vistas de página → Configuración avanzada**, mantener habilitada la opción de cambios de página basados en eventos del historial del navegador. Así se miden las navegaciones internas.
- Google, los bloqueadores y las decisiones de consentimiento pueden reducir las visitas observables; esto no es un contador absoluto de personas.

Pruebas: `node --test scripts/analytics-consent.test.js`.
