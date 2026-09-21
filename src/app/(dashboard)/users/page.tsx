"use client"

import * as React from "react"
import Link from "next/link"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Pagination } from "@/components/segments/pagination"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { apiClient } from "@/lib/api-client"

type UserRole = "user" | "vet" | "admin" | "superadmin"
type UserStatus = "active" | "suspended"

type UserRow = {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
}

type UsersResponse = {
  data: UserRow[]
  total: number
  page: number
  pageSize: number
}

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
] as const

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "user", label: "Pet owner" },
  { value: "vet", label: "Vet / Clinic" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
] as const

const ROLE_LABEL: Record<string, string> = {
  user: "Pet owner",
  vet: "Vet / Clinic",
  admin: "Admin",
  superadmin: "Superadmin",
}

const STATUS_TONE: Record<UserStatus, "success" | "danger"> = {
  active: "success",
  suspended: "danger",
}

const PAGE_SIZE = 20

function UsersPage() {
  const [query, setQuery] = React.useState("")
  const [queryInput, setQueryInput] = React.useState("")
  const [role, setRole] = React.useState("")
  const [status, setStatus] = React.useState<(typeof STATUS_TABS)[number]["id"]>("")
  const [page, setPage] = React.useState(1)

  const [rows, setRows] = React.useState<UserRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(queryInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [queryInput])

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional (re-fetches when filters/page change)
    setIsLoading(true)
    setError(null)
    apiClient
      .get<UsersResponse>("/users", {
        query: query || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotal(typeof data?.total === "number" ? data.total : 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, role, status, page])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Users</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Search pet owners and vets, review their accounts, and manage access.</p>
      </div>

      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-xs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id)
                setPage(1)
              }}
              className={`font-label-md text-label-md rounded-full px-space-md py-2 font-semibold transition-colors ${
                status === tab.id ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <div className="relative flex-1 min-w-56">
            <MaterialIcon name="search" size={18} className="absolute top-1/2 left-space-sm -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="font-body-sm text-body-sm h-10 w-full rounded-xl border border-transparent bg-surface-container-low py-2 pr-space-sm pl-9 text-on-surface outline-none focus-visible:border-primary"
            />
          </div>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setPage(1)
            }}
            className="font-label-sm text-label-sm h-10 rounded-xl border border-surface-container bg-surface-container-low px-space-sm text-on-surface"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
        {isLoading ? (
          <div className="flex flex-col gap-space-xs p-space-md">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-space-xs p-space-2xl text-center">
            <MaterialIcon name="error" size={26} className="text-destructive" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-space-xs p-space-2xl text-center">
            <MaterialIcon name="group_off" size={26} className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">No users match this view.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Name</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Contact</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Role</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Joined</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                    <td className="px-space-md py-space-sm">
                      <Link href={`/users/detail?id=${row.id}`} className="font-label-md text-label-md font-semibold text-on-surface hover:text-primary hover:underline">
                        {row.fullName || "Unnamed user"}
                      </Link>
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      <div className="flex flex-col">
                        <span>{row.email}</span>
                        {row.phone && <span>{row.phone}</span>}
                      </div>
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status ?? "unknown"}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

export default UsersPage
