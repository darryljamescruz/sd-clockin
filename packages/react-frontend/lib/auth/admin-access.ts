export interface AdminAccessUser {
  id: string
  email: string
  name?: string
  isActive: boolean
  role: "admin"
}

export interface AdminAccessResult {
  allowed: boolean
  adminUser?: AdminAccessUser
  message?: string
}

function getBackendApiBaseUrl(): string {
  return (
    process.env.AUTH_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api"
  )
}

export async function authorizeAdminAccess(data: {
  email?: string
  name?: string
}): Promise<AdminAccessResult> {
  const url = `${getBackendApiBaseUrl()}/admin-users/authorize`
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    cache: "no-store",
  })

  const contentType = response.headers.get("content-type") || ""
  let payload: AdminAccessResult = { allowed: false }
  let bodyText = ""

  if (contentType.includes("application/json")) {
    payload = (await response.json().catch(() => ({ allowed: false }))) as AdminAccessResult
  } else {
    bodyText = await response.text().catch(() => "")
  }

  if (!response.ok) {
    const fallbackMessage = bodyText
      ? bodyText.slice(0, 200)
      : `HTTP ${response.status} from ${url}`

    return {
      allowed: false,
      message: payload.message || fallbackMessage,
    }
  }

  return payload
}
