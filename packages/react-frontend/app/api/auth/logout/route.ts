import { NextRequest, NextResponse } from "next/server"
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/auth/session"

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  return forwardedProto === "https" || request.nextUrl.protocol === "https:"
}

export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/", request.url)
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  })

  return response
}
