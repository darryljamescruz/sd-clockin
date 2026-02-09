import { NextRequest, NextResponse } from "next/server"
import { getMicrosoftAuthConfig } from "@/lib/auth/config"
import { buildMicrosoftAuthorizeUrl, OAUTH_NONCE_COOKIE_NAME, OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/microsoft"

const OAUTH_STATE_TTL_SECONDS = 60 * 10

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  return forwardedProto === "https" || request.nextUrl.protocol === "https:"
}

export async function GET(request: NextRequest) {
  try {
    const config = getMicrosoftAuthConfig(request.nextUrl.origin)
    const state = crypto.randomUUID()
    const nonce = crypto.randomUUID()
    const authorizeUrl = buildMicrosoftAuthorizeUrl(config, state, nonce)

    const response = NextResponse.redirect(authorizeUrl)
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: OAUTH_STATE_TTL_SECONDS,
    })
    response.cookies.set(OAUTH_NONCE_COOKIE_NAME, nonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureRequest(request),
      path: "/",
      maxAge: OAUTH_STATE_TTL_SECONDS,
    })

    return response
  } catch (error) {
    console.error("Microsoft login setup error:", error)
    return NextResponse.redirect(new URL("/?authError=auth_config", request.url))
  }
}
