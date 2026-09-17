"use client"

import * as React from "react"
import Link from "next/link"

import { StatusPill } from "@/components/segments/status-pill"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { apiClient } from "@/lib/api-client"

type AdminProviderRow = {
  id: string
  name: string
  city: string
  status: "pending" | "approved" | "rejected"
  ownerUserId: string | null
  createdAt: string
}

const TABS = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "", label: "All" },
] as const

const STATUS_TONE: Record<AdminProviderRow["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
}

function ProvidersPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("pending")
  const [rows, setRows] = React.useState<AdminProviderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional (re-fetches when `tab` changes)
    setIsLoading(true)
    setError(null)
    apiClient
      .get<{ providers: AdminProviderRow[] }>("/providers/admin", { status: tab || undefined })
      .then((data) => {
        if (!cancelled) setRows(data.providers)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load clinics.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Clinic Approvals</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Review and approve clinic listings before they go live in search.</p>
      </div>

      <div className="flex items-center gap-space-2xs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`font-label-md text-label-md rounded-full px-space-md py-2 font-semibold transition-colors ${
              tab === t.id ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
        {isLoading ? (
          <div className="flex flex-col gap-space-xs p-space-md">
            {Array.from({ length: 4 }).map((_, index) => (
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
            <MaterialIcon name="inbox" size={26} className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">No clinics in this view.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Clinic</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">City</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Submitted</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                <th className="px-space-md py-space-sm" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                  <td className="font-label-md text-label-md px-space-md py-space-sm font-semibold text-on-surface">{row.name}</td>
                  <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{row.city}</td>
                  <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-space-md py-space-sm">
                    <StatusPill tone={STATUS_TONE[row.status]}>{row.status}</StatusPill>
                  </td>
                  <td className="px-space-md py-space-sm text-right">
                    <Link
                      href={`/providers/detail?id=${row.id}`}
                      className="font-label-sm text-label-sm font-bold text-primary hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ProvidersPage
