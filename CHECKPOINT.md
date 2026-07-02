Esto es una prueba del fork 

# Checkpoint — VibeFast boilerplate, Fases 0-2 completas

**Última actualización**: Fase 0 verificada, **Fase 1 (Auth + DB)** y **Fase 2 (Email con Resend)** implementadas y build/dev-verificadas.

## Fase 2 (Email) — ✅ código completo + build/dev verificado

### Archivos creados
- `web/lib/resend/client.js` — cliente Resend, devuelve `null` si email off (no-op silencioso).
- `web/lib/resend/templates/WaitlistConfirm.js` y `Welcome.js` — React Email, copy desde config.js.
- `web/lib/resend/send.js` — `sendWaitlistConfirm(to)`, `sendWelcome(to, name)`.
- `web/app/api/webhooks/resend/route.js` — eventos de email, verificación svix opcional (gated por `RESEND_WEBHOOK_SECRET`).
- Deps agregadas: `resend`, `@react-email/components`, `svix`.

### Cableado
- `/api/waitlist` → manda `WaitlistConfirm` con `after()` (no bloquea UI), solo en alta nueva.
- `/auth/callback` → manda `Welcome` con `after()`, solo en primer login (compara created_at vs last_sign_in_at, ventana 10s).

### Verificado
- `yarn build` limpio (incluye `/api/webhooks/resend`).
- Dev smoke: `POST /api/webhooks/resend` → 200 `{ok:true}` (path sin-secret loguea warning correcto); `/docs/features/email` → 200.

### Pendiente manual (necesita tus credenciales)
- Agrega a `web/.env.local`: `RESEND_API_KEY=re_...` y (para webhook) `RESEND_WEBHOOK_SECRET=whsec_...`.
  - ⚠️ No pude editar `.env.example` (política de archivos env). Estas 2 vars están documentadas en `docs/features/email`.
- Verifica tu dominio en Resend y ajusta `config.email.from` (o usa `onboarding@resend.dev` en dev).
- E2E: anótate al waitlist → llega el correo de confirmación; primer login con Google → llega el Welcome.

### Diferido a fase de docs (Fase 7)
- Rellenar `docs/deploy/{vercel,supabase-produccion,dominio}.mdx` (hoy son stubs).
- Script `yarn vibefast init` (opcional según el plan).

---

## Fase 1 (Auth + DB) — ✅ código completo + build/dev verificado

## Estado actual

- **Fase 0** — ✅ verificada. Se arreglaron 3 bugs que solo aparecían al correr de verdad:
  1. **Node**: el repo requería `>=20` y con Node 23 (non-LTS) fallaba `eslint-visitor-keys`. Ahora se fija Node 20/22 LTS vía `.nvmrc` (`22`) y `engines`. **Usa `nvm use` antes de trabajar.**
  2. **MDX**: `{placeholder}` en prosa rompía el build (acorn lo lee como expresión JS). Escapado a `\{...}` en quick-start y semana-1.
  3. **Ruta /docs**: el catch-all opcional `[[...slug]]` chocaba con `docs/page.js` en `next dev`. Cambiado a catch-all requerido `[...slug]`; el índice lo sirve `docs/page.js`.
  - También se agregó `typescript` como devDep (lo exige `eslint-config-next`; no implica escribir TS).

- **Fase 1** — ✅ código completo + `yarn build` limpio (46 páginas). Falta **verificación end-to-end manual** (requiere tus credenciales, ver abajo).

### Archivos creados en Fase 1

- `supabase/migrations/001_auth_profiles.sql` — tabla `profiles` + trigger `handle_new_user` (auto-crea profile al registrarse, lee metadata de Google).
- `supabase/migrations/002_waitlist.sql` — tabla `waitlist` (email unique).
- `supabase/migrations/003_core_items.sql` — CRUD genérico del MVP.
- `supabase/migrations/007_rls_policies.sql` — RLS en las 3 tablas (dueño total sobre lo suyo; waitlist insert público).
- `supabase/config.toml`, `supabase/seed.sql`.
- `web/lib/supabase/{client,server,middleware}.js` — patrón oficial @supabase/ssr. `server.js` exporta `getUser()`.
- `web/middleware.js` — reemplaza el stub: refresca sesión + protege `/dashboard|/account|/chat`. **Guard**: si no hay env de Supabase, deja pasar todo (la landing de Sem 1 funciona sin configurar nada).
- `web/app/login/page.js` — login (redirige a dashboard si ya hay sesión).
- `web/components/auth/GoogleButton.js` — `signInWithOAuth` con Google.
- `web/app/auth/callback/route.js` — `exchangeCodeForSession` + redirect (maneja proxy de Vercel).
- `web/lib/auth/actions.js` — server action `signOut`.
- `web/components/auth/UserMenu.js` — avatar + cerrar sesión.
- `web/app/(app)/layout.js` — guard + sidebar + UserMenu.
- `web/app/(app)/dashboard/page.js` + `dashboard/actions.js` — CRUD de `core_items` con server actions (create/toggle/delete), filtra por user_id + RLS.
- `web/app/api/waitlist/route.js` — ahora inserta real en `waitlist` (trata email duplicado como éxito).
- `web/package.json` — agregadas deps `@supabase/ssr`, `@supabase/supabase-js`.

### Verificado automáticamente (sin credenciales)

- `yarn build` limpio (46 páginas, sin errores de lint/MDX).
- `yarn dev` levanta; probado por HTTP:
  - `/`, `/docs`, `/docs/setup/quick-start`, `/docs/tutoriales/semana-1-landing`, `/login` → **200**
  - `/dashboard` → **307 → /login** (protección OK).

## Verificación end-to-end pendiente (necesita TUS credenciales)

No pude probar el flujo real de auth/DB porque requiere un proyecto Supabase + Google OAuth + `.env.local`, que no puedo crear por ti. Pasos:

1. **Crea proyecto Supabase Cloud** y copia URL + anon key + service_role.
2. **Crea `web/.env.local`** (`cp web/.env.example web/.env.local`) y pega las 3 vars de Supabase.
   - ⚠️ No pude editar `.env.example` (política de archivos env en esta sesión). Confirma que tenga `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Si falta alguna, agrégala.
3. **Sube migrations**: con Supabase CLI `supabase link` + `supabase db push` (o pega los 4 SQL en el SQL Editor en orden 001→002→003→007).
4. **Configura Google** en Supabase: Authentication → Providers → Google (client id/secret de Google Cloud Console). Redirect URL: `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
5. `nvm use && yarn dev`. Prueba:
   - `/login` → "Continuar con Google" → consientes → vuelves a `/dashboard`.
   - En Supabase, tabla `profiles` tiene tu fila (creada por el trigger).
   - En `/dashboard`: crea / marca hecho / borra un item. Verifica en tabla `core_items` que `user_id` es el tuyo.
   - Logout desde el UserMenu → vuelves a `/`.
   - En la landing, manda un email al waitlist → aparece en tabla `waitlist`.

## Cómo retomar con Claude

`nvm use` y luego, en `~/VibeFast`: dime **"continúa con Fase 2"** (Email + Deploy story):
- Resend: cliente + templates (WaitlistConfirm, Welcome).
- Webhook `/api/webhooks/resend`.
- Conectar waitlist → envío de email de confirmación.
- Guía Vercel + Supabase producción.

Plan completo (Fases 1-7): `/Users/ampersand/.claude/plans/users-ampersand-downloads-temario-v2-cu-rippling-owl.md`

## Notas que NO se deben perder

- **Node 20/22 LTS obligatorio** — corre `nvm use` (hay `.nvmrc`). Node 23 rompe el install.
- **yarn 1.x con workspaces** — nunca `npm install`. Root Directory en Vercel = `web`.
- **`docs-content/` vive en la raíz**, no en `/web` (`web/lib/docs.js` lo resuelve con `..`).
- **`config.js` se evalúa en build** — cambios en prod requieren re-deploy.
- **Middleware tiene guard de env** — sin Supabase configurado la app pública sigue corriendo (a propósito, para Sem 1).
- **RLS + filtro por user_id** en las server actions: defensa en profundidad, no quitar uno por el otro.
