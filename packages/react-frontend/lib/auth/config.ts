const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8

export interface MicrosoftAuthConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string
  allowedEmails: Set<string>
  allowedDomains: Set<string>
  allowedGroupIds: Set<string>
  sessionTtlSeconds: number
}

function getEnvVar(name: string): string | undefined {
  const value = process.env[name]
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function requireEnvVar(...names: string[]): string {
  for (const name of names) {
    const value = getEnvVar(name)
    if (value) {
      return value
    }
  }

  throw new Error(`Missing required environment variable. Expected one of: ${names.join(", ")}`)
}

function parseCsvSet(value: string | undefined, { lowercase = true }: { lowercase?: boolean } = {}): Set<string> {
  if (!value) {
    return new Set<string>()
  }

  const items = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (lowercase ? entry.toLowerCase() : entry))

  return new Set(items)
}

function parseSessionTtl(rawValue: string | undefined): number {
  if (!rawValue) {
    return DEFAULT_SESSION_TTL_SECONDS
  }

  const parsed = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_TTL_SECONDS
  }

  return parsed
}

export function getSessionSecret(): string {
  return requireEnvVar(
    "AUTH_SESSION_SECRET",
    "MICROSOFT_SESSION_SECRET",
    "MICROSOFT_CLIENT_SECRET",
    "AZURE_CLIENT_SECRET",
  )
}

export function getMicrosoftAuthConfig(origin: string): MicrosoftAuthConfig {
  const tenantId = requireEnvVar("MICROSOFT_TENANT_ID", "AZURE_TENANT_ID")
  const clientId = requireEnvVar("MICROSOFT_CLIENT_ID", "AZURE_CLIENT_ID")
  const clientSecret = requireEnvVar("MICROSOFT_CLIENT_SECRET", "AZURE_CLIENT_SECRET")
  const redirectUri = getEnvVar("MICROSOFT_REDIRECT_URI") || `${origin}/api/auth/callback`
  const scopes = getEnvVar("MICROSOFT_SCOPES") || "openid profile email offline_access"
  const sessionTtlSeconds = parseSessionTtl(getEnvVar("ADMIN_SESSION_TTL_SECONDS"))
  const allowedEmails = parseCsvSet(getEnvVar("MICROSOFT_ALLOWED_EMAILS"))
  const allowedDomains = parseCsvSet(getEnvVar("MICROSOFT_ALLOWED_DOMAINS"))
  const allowedGroupIds = parseCsvSet(getEnvVar("MICROSOFT_ALLOWED_GROUP_IDS"))

  return {
    tenantId,
    clientId,
    clientSecret,
    redirectUri,
    scopes,
    sessionTtlSeconds,
    allowedEmails,
    allowedDomains,
    allowedGroupIds,
  }
}
