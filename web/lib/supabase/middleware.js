// ============================================================
// Supabase · refresh de sesión en el middleware
// ------------------------------------------------------------
// Se llama desde web/middleware.js en cada request. Hace dos cosas:
//   1. Refresca el token de sesión (cookies) si está por expirar.
//   2. Protege rutas: si la ruta requiere auth y no hay usuario,
//      redirige a /login.
//
// Patrón oficial de Supabase SSR. No reordenes: getUser() debe
// correr entre crear la response y devolverla, o las cookies
// quedan desincronizadas.
// ============================================================

import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import config from "@/config"

// Rutas que requieren sesión. Todo lo que cuelga de /(app) en realidad,
// pero el middleware no ve grupos de rutas, así que listamos prefijos.
const PROTECTED_PREFIXES = ["/dashboard", "/account", "/chat"]

export async function updateSession(request) {
  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // #region agent log
  let _dbgSupaUrlOk = false
  let _dbgSupaUrlErr = null
  try {
    if (url) {
      new URL(url)
      _dbgSupaUrlOk = true
    }
  } catch (e) {
    _dbgSupaUrlErr = e instanceof Error ? e.message : String(e)
  }
  fetch("http://127.0.0.1:7598/ingest/ede61043-0435-486e-89b5-47fecd17318d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "0f553b",
    },
    body: JSON.stringify({
      sessionId: "0f553b",
      runId: "pre-fix",
      hypothesisId: "B",
      location: "web/lib/supabase/middleware.js:updateSession",
      message: "Middleware env check before createServerClient",
      data: {
        hasUrl: Boolean(url && url.trim()),
        hasAnonKey: Boolean(anonKey && anonKey.trim()),
        urlLooksLikeHostOnly: Boolean(url && !/^https?:\/\//i.test(url)),
        supabaseUrlParsesOk: _dbgSupaUrlOk,
        supabaseUrlParseError: _dbgSupaUrlErr,
        pathname: request.nextUrl.pathname,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  // Antes de Sem 2 el alumno aún no configuró Supabase. Sin claves,
  // dejamos pasar todo para que la landing (Sem 1) funcione igual.
  if (!url || !anonKey) return response

  let user = null
  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    // IMPORTANTE: no metas lógica entre createServerClient y getUser().
    const result = await supabase.auth.getUser()
    user = result.data.user

    // #region agent log
    fetch("http://127.0.0.1:7598/ingest/ede61043-0435-486e-89b5-47fecd17318d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "0f553b",
      },
      body: JSON.stringify({
        sessionId: "0f553b",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "web/lib/supabase/middleware.js:getUser",
        message: "getUser completed",
        data: {
          hasUser: Boolean(user),
          authError: result.error ? result.error.message : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7598/ingest/ede61043-0435-486e-89b5-47fecd17318d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "0f553b",
      },
      body: JSON.stringify({
        sessionId: "0f553b",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "web/lib/supabase/middleware.js:catch",
        message: "Middleware threw during Supabase session",
        data: {
          errorName: err instanceof Error ? err.name : "unknown",
          errorMessage: err instanceof Error ? err.message : String(err),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    throw err
  }

  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = config.auth.loginUrl
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Si ya hay sesión y va a /login, mándalo al dashboard.
  if (user && pathname === config.auth.loginUrl) {
    const url = request.nextUrl.clone()
    url.pathname = config.auth.afterLoginUrl
    return NextResponse.redirect(url)
  }

  return response
}
