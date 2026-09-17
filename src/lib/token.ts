const ACCESS_TOKEN_KEY = "pawstives_admin_access_token"

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return
  try {
    if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
    else window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
}

export { getAccessToken, setAccessToken }
