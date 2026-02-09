import type { MicrosoftAuthConfig } from "@/lib/auth/config"

export const OAUTH_STATE_COOKIE_NAME = "admin_oauth_state"
export const OAUTH_NONCE_COOKIE_NAME = "admin_oauth_nonce"

export interface MicrosoftTokenResponse {
  token_type?: string
  scope?: string
  expires_in?: number
  ext_expires_in?: number
  access_token?: string
  refresh_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

export interface MicrosoftIdTokenClaims {
  aud?: string
  iss?: string
  exp?: number
  iat?: number
  tid?: string
  sub?: string
  oid?: string
  name?: string
  preferred_username?: string
  email?: string
  groups?: string[]
  nonce?: string
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = `${normalized}${"=".repeat(paddingLength)}`
  return atob(padded)
}

function decodeJwtPart<T>(jwtPart: string): T {
  const binary = decodeBase64Url(jwtPart)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json) as T
}

export function buildMicrosoftAuthorizeUrl(config: MicrosoftAuthConfig, state: string, nonce: string): string {
  const authorizeUrl = new URL(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize`)
  authorizeUrl.searchParams.set("client_id", config.clientId)
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("response_mode", "query")
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri)
  authorizeUrl.searchParams.set("scope", config.scopes)
  authorizeUrl.searchParams.set("state", state)
  authorizeUrl.searchParams.set("nonce", nonce)

  return authorizeUrl.toString()
}

export async function exchangeCodeForTokens(
  config: MicrosoftAuthConfig,
  code: string,
): Promise<MicrosoftTokenResponse> {
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    scope: config.scopes,
  })

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const payload = (await response.json()) as MicrosoftTokenResponse
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Microsoft token exchange failed")
  }

  return payload
}

export function parseIdTokenClaims(idToken: string): MicrosoftIdTokenClaims {
  const parts = idToken.split(".")
  if (parts.length !== 3) {
    throw new Error("Invalid id_token returned by Microsoft")
  }

  return decodeJwtPart<MicrosoftIdTokenClaims>(parts[1])
}

export function validateIdTokenClaims(claims: MicrosoftIdTokenClaims, config: MicrosoftAuthConfig): boolean {
  const now = Math.floor(Date.now() / 1000)
  if (!claims.exp || claims.exp <= now) {
    return false
  }

  if (!claims.aud || claims.aud !== config.clientId) {
    return false
  }

  if (!claims.iss || !claims.iss.startsWith("https://login.microsoftonline.com/")) {
    return false
  }

  const tenantModes = new Set(["common", "organizations", "consumers"])
  if (!tenantModes.has(config.tenantId.toLowerCase())) {
    return claims.tid === config.tenantId
  }

  return true
}

function getNormalizedEmail(claims: MicrosoftIdTokenClaims): string | undefined {
  const emailValue = claims.preferred_username || claims.email
  if (!emailValue) {
    return undefined
  }

  return emailValue.toLowerCase()
}

export function isUserAuthorized(claims: MicrosoftIdTokenClaims, config: MicrosoftAuthConfig): boolean {
  const hasRestrictions =
    config.allowedEmails.size > 0 || config.allowedDomains.size > 0 || config.allowedGroupIds.size > 0

  if (!hasRestrictions) {
    return true
  }

  const normalizedEmail = getNormalizedEmail(claims)
  if (normalizedEmail && config.allowedEmails.has(normalizedEmail)) {
    return true
  }

  if (normalizedEmail && normalizedEmail.includes("@")) {
    const domain = normalizedEmail.split("@")[1]
    if (domain && config.allowedDomains.has(domain)) {
      return true
    }
  }

  if (Array.isArray(claims.groups) && claims.groups.length > 0) {
    for (const group of claims.groups) {
      if (config.allowedGroupIds.has(group.toLowerCase())) {
        return true
      }
    }
  }

  return false
}

export function getUserIdentity(claims: MicrosoftIdTokenClaims): {
  subject: string
  name?: string
  email?: string
  tenantId?: string
} {
  return {
    subject: claims.oid || claims.sub || "",
    name: claims.name,
    email: claims.preferred_username || claims.email,
    tenantId: claims.tid,
  }
}
