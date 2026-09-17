"use client"

import * as React from "react"

import { ApiError, apiClient } from "@/lib/api-client"
import { getAccessToken, setAccessToken } from "@/lib/token"

const ADMIN_ROLES = ["admin", "superadmin"] as const
type AdminRole = (typeof ADMIN_ROLES)[number]

type AdminUser = {
  id: string
  email: string
  fullName: string
  role: AdminRole
}

type SessionStatus = "loading" | "authenticated" | "unauthenticated"

type AdminSessionContextValue = {
  status: SessionStatus
  user: AdminUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminSessionContext = React.createContext<AdminSessionContextValue | null>(null)

function isAdminRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role)
}

function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<SessionStatus>(() => (getAccessToken() ? "loading" : "unauthenticated"))
  const [user, setUser] = React.useState<AdminUser | null>(null)

  React.useEffect(() => {
    if (!getAccessToken()) return
    apiClient
      .get<{ user: AdminUser }>("/auth/me")
      .then(({ user: profile }) => {
        if (isAdminRole(profile.role)) {
          setUser(profile)
          setStatus("authenticated")
        } else {
          setAccessToken(null)
          setStatus("unauthenticated")
        }
      })
      .catch(() => {
        setAccessToken(null)
        setStatus("unauthenticated")
      })
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<{ accessToken: string; user: AdminUser }>("/auth/login", { email, password })
    if (!isAdminRole(data.user.role)) {
      throw new ApiError(403, "This account doesn't have admin access.")
    }
    setAccessToken(data.accessToken)
    setUser(data.user)
    setStatus("authenticated")
  }, [])

  const logout = React.useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const value = React.useMemo(() => ({ status, user, login, logout }), [status, user, login, logout])

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}

function useAdminSession() {
  const context = React.useContext(AdminSessionContext)
  if (!context) throw new Error("useAdminSession must be used within AdminSessionProvider")
  return context
}

export { AdminSessionProvider, useAdminSession }
export type { AdminRole, AdminUser }
