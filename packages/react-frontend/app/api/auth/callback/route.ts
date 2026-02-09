import { NextRequest, NextResponse } from "next/server"
import { getMicrosoftAuthConfig, getSessionSecret } from "@/lib/auth/config"
import { authorizeAdminAccess } from "@/lib/auth/admin-access"
import {
  exchangeCodeForTokens,
  getUserIdentity,
  isUserAuthorized,
  OAUTH_NONCE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  parseIdTokenClaims,
  validateIdTokenClaims,
} from "@/lib/auth/microsoft"
import { ADMIN_SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth/session"

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  return forwardedProto === "https" || request.nextUrl.protocol === "https:"
}

function redirectWithError(request: NextRequest, errorCode: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/?authError=${errorCode}`, request.url))
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  })
  response.cookies.set(OAUTH_NONCE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  })

  return response
}

export async function GET(request: NextRequest) {
  const stateParam = request.nextUrl.searchParams.get("state")
  const code = request.nextUrl.searchParams.get("code")
  const error = request.nextUrl.searchParams.get("error")
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value
  const expectedNonce = request.cookies.get(OAUTH_NONCE_COOKIE_NAME)?.value

  if (error) {
    return redirectWithError(request, "microsoft_error")
  }

  if (!stateParam || !expectedState || stateParam !== expectedState) {
    return redirectWithError(request, "invalid_state")
  }

  if (!code) {
    return redirectWithError(request, "missing_code")
  }

  try {
    const config = getMicrosoftAuthConfig(request.nextUrl.origin)
    const tokens = await exchangeCodeForTokens(config, code)

    if (!tokens.id_token) {
      return redirectWithError(request, "missing_id_token")
    }

    const claims = parseIdTokenClaims(tokens.id_token)
    if (!validateIdTokenClaims(claims, config)) {
      return redirectWithError(request, "invalid_token")
    }
    if (!claims.nonce || !expectedNonce || claims.nonce !== expectedNonce) {
      return redirectWithError(request, "invalid_nonce")
    }

    if (!isUserAuthorized(claims, config)) {
      return redirectWithError(request, "not_allowed")
    }

    const identity = getUserIdentity(claims)
    if (!identity.subject) {
      return redirectWithError(request, "missing_subject")
    }

    let accessResponse
    try {
      accessResponse = await authorizeAdminAccess({
        email: identity.email,
        name: identity.name,
      })
    } catch (adminAccessError) {
      console.error("Admin access API unreachable:", adminAccessError)
      return redirectWithError(request, "admin_api_unreachable")
    }

    if (!accessResponse.allowed || !accessResponse.adminUser || !accessResponse.adminUser.isActive) {
      return redirectWithError(request, "not_allowed_admin")
    }

    const issuedAt = Math.floor(Date.now() / 1000)
    const sessionToken = await createSessionToken(
      {
        sub: identity.subject,
        name: accessResponse.adminUser.name || identity.name,
        email: accessResponse.adminUser.email || identity.email,
        tid: identity.tenantId,
        roles: ["admin"],
        iat: issuedAt,
        exp: issuedAt + config.sessionTtlSeconds,
      },
      getSessionSecret(),
    )

    const response = NextResponse.redirect(new URL("/admin", request.url))
    const secure = isSecureRequest(request)

    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: config.sessionTtlSeconds,
    })
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    })
    response.cookies.set(OAUTH_NONCE_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    })

    return response
  } catch (callbackError) {
    console.error("Microsoft callback error:", callbackError)
    return redirectWithError(request, "callback_failed")
  }
}
