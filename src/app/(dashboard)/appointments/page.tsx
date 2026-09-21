"use client"

import * as React from "react"
import Link from "next/link"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Pagination } from "@/components/segments/pagination"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { apiClient } from "@/lib/api-client"

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | string

type AppointmentRow = {
  id: string
  status: AppointmentStatus
  scheduledAt?: string | null
  date?: string | null
  time?: string | null
  serviceName?: string | null
  servicePrice?: number | null
  fee?: number | null
  providerId?: string | null
  providerName?: string | null
  ownerName?: string | null
  petName?: string | null
  createdByRole?: string | null
}

type AppointmentsResponse = {
  data: AppointmentRow[]
  total: number
  page: number
  pageSize: number
}

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
] as const

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
}

const PAGE_SIZE = 20

function formatScheduled(row: AppointmentRow): string {
  const iso = row.scheduledAt ?? (row.date ? `${row.date}T${row.time ?? "00:00"}` : null)
  if (!iso) return "Unscheduled"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return String(iso)
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}

function formatFee(row: AppointmentRow): string | null {
  const value = row.servicePrice ?? row.fee
  if (value == null || Number.isNaN(Number(value))) return null
  return `$${Number(value).toFixed(2)}`
}

function AppointmentsPage() {
  const [status, setStatus] = React.useState<(typeof STATUS_TABS)[number]["id"]>("")
  const [queryInput, setQueryInput] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [rows, setRows] = React.useState<AppointmentRow[]>([])
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
      .get<AppointmentsResponse>("/appointments/admin", {
        status: status || undefined,
        query: query || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotal(typeof data?.total === "number" ? data.total : 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load appointments.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [status, query, dateFrom, dateTo, page])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Appointments</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">A read-only view of every appointment across all clinics.</p>
      </div>

      <div className="flex items-start gap-space-xs rounded-2xl bg-secondary-container/30 px-space-lg py-space-md">
        <MaterialIcon name="info" size={20} className="mt-0.5 shrink-0 text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          This is a cross-clinic overview only. To accept, decline, reschedule, or adjust the fee on an appointment, open the clinic&apos;s own
          management page from the link in each row.
        </p>
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
          <div className="relative min-w-56 flex-1">
            <MaterialIcon name="search" size={18} className="absolute top-1/2 left-space-sm -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search by pet, owner, or clinic"
              className="font-body-sm text-body-sm h-10 w-full rounded-xl border border-transparent bg-surface-container-low py-2 pr-space-sm pl-9 text-on-surface outline-none focus-visible:border-primary"
            />
          </div>
          <label className="flex items-center gap-space-2xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
              className="font-label-sm text-label-sm h-10 rounded-xl border border-surface-container bg-surface-container-low px-space-sm text-on-surface"
            />
          </label>
          <label className="flex items-center gap-space-2xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
              className="font-label-sm text-label-sm h-10 rounded-xl border border-surface-container bg-surface-container-low px-space-sm text-on-surface"
            />
          </label>
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
            <MaterialIcon name="event_busy" size={26} className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">No appointments match this view.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">When</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Pet / Owner</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Service</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Clinic</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                  <th className="px-space-md py-space-sm" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const fee = formatFee(row)
                  return (
                    <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                      <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{formatScheduled(row)}</td>
                      <td className="px-space-md py-space-sm">
                        <div className="flex flex-col">
                          <span className="font-label-md text-label-md font-semibold text-on-surface">{row.petName ?? "Unknown pet"}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">{row.ownerName ?? "Unknown owner"}</span>
                        </div>
                      </td>
                      <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                        {row.serviceName ?? "—"}
                        {fee ? ` • ${fee}` : ""}
                      </td>
                      <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{row.providerName ?? "—"}</td>
                      <td className="px-space-md py-space-sm">
                        <StatusPill tone={STATUS_TONE[row.status] ?? "neutral"}>{row.status ?? "unknown"}</StatusPill>
                      </td>
                      <td className="px-space-md py-space-sm text-right">
                        {row.providerId && (
                          <Link
                            href={`/vets/detail?id=${row.providerId}`}
                            className="font-label-sm text-label-sm font-bold text-primary hover:underline"
                          >
                            Manage at clinic
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}

export default AppointmentsPage
