"use client"

import * as React from "react"
import Link from "next/link"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Pagination } from "@/components/segments/pagination"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { apiClient } from "@/lib/api-client"

type DisputeStatus = "open" | "investigating" | "resolved" | "dismissed"

type DisputeRow = {
  id: string
  subject: string
  status: DisputeStatus
  providerName: string | null
  petName: string | null
  ownerName: string | null
  raisedByRole: string | null
  createdAt: string
}

type DisputesResponse = {
  data: DisputeRow[]
  total: number
  page: number
  pageSize: number
}

const TABS = [
  { id: "open", label: "Open" },
  { id: "investigating", label: "Investigating" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "", label: "All" },
] as const

const STATUS_TONE: Record<DisputeStatus, "warning" | "info" | "success" | "neutral"> = {
  open: "warning",
  investigating: "info",
  resolved: "success",
  dismissed: "neutral",
}

const PAGE_SIZE = 20

function DisputesPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("open")
  const [page, setPage] = React.useState(1)
  const [rows, setRows] = React.useState<DisputeRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional (re-fetches when tab/page change)
    setIsLoading(true)
    setError(null)
    apiClient
      .get<DisputesResponse>("/disputes", { status: tab || undefined, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotal(typeof data?.total === "number" ? data.total : 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load disputes.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab, page])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Disputes</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Resolve disputes raised between pet owners and providers.</p>
      </div>

      <div className="flex flex-wrap items-center gap-space-2xs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              setPage(1)
            }}
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
            <p className="font-body-sm text-body-sm text-on-surface-variant">No disputes in this view.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Subject</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Provider</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Raised by</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Submitted</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                  <th className="px-space-md py-space-sm" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                    <td className="px-space-md py-space-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">{row.subject || "Untitled dispute"}</span>
                        {row.petName && <span className="font-body-sm text-body-sm text-on-surface-variant">{row.petName}</span>}
                      </div>
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{row.providerName ?? "—"}</td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      {row.ownerName ?? "—"} {row.raisedByRole ? `(${row.raisedByRole})` : ""}
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-space-md py-space-sm">
                      <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status ?? "unknown"}</StatusPill>
                    </td>
                    <td className="px-space-md py-space-sm text-right">
                      <Link href={`/disputes/detail?id=${row.id}`} className="font-label-sm text-label-sm font-bold text-primary hover:underline">
                        Review
                      </Link>
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

export default DisputesPage
