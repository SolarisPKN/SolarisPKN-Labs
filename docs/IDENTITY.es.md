# SolarisPKN ID: puesta en marcha GRATIS / FREE deployment

## Estado actual: NO ACTIVADO
Se agregaron el código de Mi cuenta, endpoints del Worker, una migración D1 privada y pruebas de regresión. No se configuró ninguna credencial ni base de datos real. La bandera ACCOUNT_ENABLED debe ser exactamente true y las demás dependencias deben estar configuradas para activar registros. El PR permanece en borrador y no ha sido fusionado con main.

**No hay un sistema de usuarios en producción aún.** No vender este prototipo como sistema de autenticación auditado.

## Implementado y conectado
- Google OpenID Connect y GitHub OAuth mediante Authorization Code + PKCE S256.
- Google: valida firma RSA de ID token usando JWKS, además de issuer, audience, nonce, expiración y subject.
- GitHub: usa access token únicamente para validar el usuario con API GitHub. **No almacena tokens de proveedores**.
- Búsqueda de identidad por HMAC del identificador estable, no por correo.
- Cookies HttpOnly, Secure, SameSite=Lax, prefijo __Host-. Sesiones revocables con expiración fija a 7 días.
- Favoritos, seguimiento de proyectos, preferencias, alias público, exportación y eliminación de datos.
- Comentarios protegidos por Turnstile y límites de frecuencia. Los comentarios se insertan como pending; el público solo ve approved.
- Las rutas /api/* siempre pasan primero por Worker, nunca son archivos del sitio estático.
- D1 usa sentencias parametrizadas. Usuarios, sesiones y comentarios están fuera del repositorio.
- La web pública sigue disponible sin cuenta.

## Aún NO implementado
- Passkeys/WebAuthn y recuperación con códigos.
- Fusión segura de dos proveedores en una cuenta.
- Microsoft, Yandex, Baidu, Apple, LINE, Kakao, Naver y otros proveedores.
- Panel web de moderación y notificaciones automáticas a seguidores.
- Test de penetración, E2E real con proveedor y verificación operativa con D1.
La interfaz informa claramente qué falta; no contiene botones simulando esas capacidades.

## Activación gradual solo Free

1. Usar el plan Cloudflare Workers FREE. Crear una D1 FREE (ejemplo: npx wrangler d1 create solarispkn-labs-identity). No permitir upgrades a consumo facturable.
2. Añadir manualmente a wrangler.jsonc el binding D1 con nombre DB, database_name solarispkn-labs-identity y database_id tal como lo muestra Cloudflare. El ID real solo podrá conocerse después de crear la base; no hay valores ficticios en el código.
3. Revisar migrations/0001_identity.sql. Aplicar primero las migraciones D1 locales y después remotamente (npx wrangler d1 migrations apply solarispkn-labs-identity --local; luego --remote). El paso --remote cambia recursos reales y no se hizo desde ChatGPT.
4. Crear un widget gratuito de Cloudflare Turnstile limitado al dominio labs.solarispkn.com.ar. El sitio web debe cargar la site key pública y el Worker verificar cada token con el secret.
5. Registrar Google OAuth Web con callback EXACTO https://labs.solarispkn.com.ar/api/auth/callback/google
6. Registrar GitHub OAuth App con callback EXACTO https://labs.solarispkn.com.ar/api/auth/callback/github
7. Guardar con la funcionalidad de Cloudflare Worker Secrets, nunca en Git:
   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET,
   TURNSTILE_SITE_KEY, TURNSTILE_SECRET,
   IDENTITY_PEPPER (cadena aleatoria de alta entropía, longitud mínima 32).
   Es posible configurar secretos mediante npx wrangler secret put NOMBRE. No usar archivos .env versionados ni exponer secretos por CI.
8. Mantener ACCOUNT_ENABLED distinto de true hasta que haya revisión de seguridad, pruebas con identidades reales de prueba y confirmación de cuotas gratuitas.
9. Tras verificar D1, OAuth, Turnstile, sesiones, recuperación y recuperación de cuota, establecer ACCOUNT_ENABLED=true mediante la configuración del Worker. No habilitar servicios de pago.
10. Programar retención/limpieza en D1 de oauth_flows (5-10 minutos), sesiones expiradas y rate_buckets antiguos. No guardar IP en claro.

## Seguridad, privacidad y advertencias

- Nunca almacenar correos, contraseñas, access tokens OAuth, refresh tokens, nombres reales o el contenido del usuario en el repo ni en public/.
- El pepper HMAC de identities debe permanecer estable. Rotarlo sin migración rompe la vinculación con identidades existentes.
- No vincular cuentas por coincidencia de correo: Google y GitHub generan cuentas separadas en esta fase.
- La cuenta usa su proveedor externo como única forma de retorno. No prometemos recuperación si el usuario pierde todos los proveedores. Passkeys y recuperación son trabajo pendiente.
- El sistema no implementa cifrado de extremo a extremo; un Worker comprometido que acceda a D1 puede ver los datos de aplicación.
- Las reglas actuales CSP aún permiten unsafe-inline y unsafe-eval para compatibilidad con el frontend existente. Deben eliminarse y probarse antes de lanzamiento real de cuentas.
- Rate limits reducen el riesgo de automatización pero no garantizan impedir el 100% de bots. Turnstile debe validarse en servidor, incluyendo hostname y action.
- La API no acepta escrituras sin sesión y comprueba Origin. No almacenar tokens de sesión en localStorage.
- El código abierto no concede acceso a la base D1 ni a los secretos de Cloudflare; proteger también los permisos de despliegue y GitHub Actions.
- El servidor debe fallar cerrado cuando se agota una cuota Free. Un fallo de DB o secreto no debe habilitar rutas anónimas.

## Moderación en fase 1
Los comentarios enviados NO se publican sin revisión. Un operador autorizado puede revisarlos manualmente desde el editor SQL privado de D1.
Consulta de pendientes:
SELECT id, post_slug, body, created_at FROM comments WHERE status='pending' ORDER BY created_at DESC LIMIT 100;
Para aprobar un ID verificado manualmente:
UPDATE comments SET status='approved', reviewed_at=unixepoch() WHERE id='ID_VERIFICADO' AND status='pending';
Para rechazar:
UPDATE comments SET status='rejected', reviewed_at=unixepoch() WHERE id='ID_VERIFICADO' AND status='pending';
Las consultas deben ejecutarse en el editor seguro de D1, NO en el repositorio. Un panel administrativo de moderación necesita rol/permiso y step-up, está pendiente.

## Endpoints
Públicos: GET /api/account/status; GET /api/comments?post=SLUG.
OAuth: POST /api/auth/start; GET /api/auth/callback/google; GET /api/auth/callback/github.
Autenticados: GET /api/account/me; GET /api/account/overview; POST /api/account/logout;
GET/POST /api/account/favorites; GET/POST /api/account/follows;
GET/POST /api/account/preferences; POST /api/account/profile;
GET /api/account/export; POST /api/account/delete;
POST /api/comments; GET /api/account/comments; POST /api/account/comments/delete.

## Validación
CI: node --test scripts/identity.test.js; npm run check; npm run build.
No se desplegaron cuentas reales ni se ejecutaron pruebas OAuth E2E contra credenciales reales.

Documentación:
- Cloudflare Workers routing: https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- Cloudflare D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- Cloudflare Turnstile Siteverify: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Google OIDC: https://developers.google.com/identity/openid-connect/openid-connect
- GitHub PKCE: https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/
