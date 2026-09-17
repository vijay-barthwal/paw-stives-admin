"use client"

import * as React from "react"
import Link from "next/link"

import { useAdminSession } from "@/components/auth/admin-session-provider"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { apiClient } from "@/lib/api-client"

type StatCard = { label: string; value: number | null; icon: string; href: string; tone: string }

function DashboardHomePage() {
  const { user } = useAdminSession()
  const [counts, setCounts] = React.useState<Record<"pending" | "approved" | "rejected", number | null>>({
    pending: null,
    approved: null,
    rejected: null,
  })
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    Promise.all(
      (["pending", "approved", "rejected"] as const).map((status) =>
        apiClient.get<{ providers: unknown[] }>("/providers/admin", { status }).then((data) => [status, data.providers.length] as const)
      )
    )
      .then((results) => {
        if (cancelled) return
        setCounts(Object.fromEntries(results) as typeof counts)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const cards: StatCard[] = [
    { label: "Pending Approvals", value: counts.pending, icon: "hourglass_top", href: "/providers", tone: "text-secondary" },
    { label: "Approved Clinics", value: counts.approved, icon: "verified", href: "/providers", tone: "text-primary" },
    { label: "Rejected Clinics", value: counts.rejected, icon: "block", href: "/providers", tone: "text-destructive" },
  ]

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Here&apos;s what&apos;s happening on the platform today.</p>
      </div>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md"
          >
            <span className={`flex size-10 items-center justify-center rounded-xl bg-surface-container-high ${card.tone}`}>
              <MaterialIcon name={card.icon} size={22} />
            </span>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{card.value ?? "—"}</span>
            )}
            <span className="font-label-md text-label-md font-semibold text-on-surface-variant">{card.label}</span>
          </Link>
        ))}
      </div>

      {counts.pending !== null && counts.pending > 0 && (
        <div className="flex items-center justify-between gap-space-sm rounded-2xl bg-secondary-container/30 px-space-lg py-space-md">
          <div className="flex items-center gap-space-sm">
            <MaterialIcon name="priority_high" size={22} className="text-on-secondary-container" />
            <p className="font-label-md text-label-md font-semibold text-on-secondary-container">
              {counts.pending} clinic{counts.pending === 1 ? "" : "s"} waiting for review.
            </p>
          </div>
          <Link href="/providers" className="font-label-md text-label-md font-bold text-on-secondary-container hover:underline">
            Review now
          </Link>
        </div>
      )}
    </div>
  )
}

export default DashboardHomePage
