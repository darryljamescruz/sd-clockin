export const ADMIN_SESSION_COOKIE_NAME = "admin_session"

const TOKEN_ALGORITHM = "HS256"
const TOKEN_TYPE = "JWT"

export interface AdminSessionPayload {
  sub: string
  name?: string
  email?: string
  tid?: string
  roles: string[]
  iat: number
  exp: number
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const padded = `${normalized}${"=".repeat(paddingLength)}`
  return atob(padded)
}

function decodeBase64UrlToJson<T>(value: string): T {
  const binary = fromBase64Url(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  const jsonString = new TextDecoder().decode(bytes)
  return JSON.parse(jsonString) as T
}

async function signValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    toBytes(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  )

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, toBytes(value))
  return toBase64Url(new Uint8Array(signatureBuffer))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }

  return difference === 0
}

export async function createSessionToken(payload: AdminSessionPayload, secret: string): Promise<string> {
  const header = toBase64Url(toBytes(JSON.stringify({ alg: TOKEN_ALGORITHM, typ: TOKEN_TYPE })))
  const encodedPayload = toBase64Url(toBytes(JSON.stringify(payload)))
  const signingInput = `${header}.${encodedPayload}`
  const signature = await signValue(signingInput, secret)

  return `${signingInput}.${signature}`
}

export async function verifySessionToken(token: string, secret: string): Promise<AdminSessionPayload | null> {
  const parts = token.split(".")
  if (parts.length !== 3) {
    return null
  }

  const [headerPart, payloadPart, signaturePart] = parts
  const expectedSignature = await signValue(`${headerPart}.${payloadPart}`, secret)
  if (!timingSafeEqual(expectedSignature, signaturePart)) {
    return null
  }

  const header = decodeBase64UrlToJson<{ alg?: string; typ?: string }>(headerPart)
  if (header.alg !== TOKEN_ALGORITHM || header.typ !== TOKEN_TYPE) {
    return null
  }

  const payload = decodeBase64UrlToJson<AdminSessionPayload>(payloadPart)
  const now = Math.floor(Date.now() / 1000)
  if (!payload.sub || payload.exp <= now) {
    return null
  }

  return payload
}
