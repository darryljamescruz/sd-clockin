import { NextRequest, NextResponse } from "next/server"
import { getSessionSecret } from "@/lib/auth/config"
import { ADMIN_SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
  if (!sessionToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const payload = await verifySessionToken(sessionToken, getSessionSecret())
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      sub: payload.sub,
      name: payload.name || "",
      email: payload.email || "",
      roles: payload.roles,
    })
  } catch (error) {
    console.error("Failed to fetch admin session identity:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
