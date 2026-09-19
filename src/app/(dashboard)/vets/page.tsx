"use client"

import * as React from "react"
import Link from "next/link"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { apiClient } from "@/lib/api-client"

type AdminProviderRow = {
  id: string
  name: string
  city: string
  status: "pending" | "approved" | "rejected"
  ownerUserId: string | null
  createdAt: string
}

/**
 * Vet Management landing page — lists approved clinics/vets so an admin can
 * open one and manage its appointments, availability, and fees on the
 * vet's behalf. This is distinct from "Clinic Approvals", which handles the
 * pending/rejected onboarding workflow.
 */
function VetsPage() {
  const [rows, setRows] = React.useState<AdminProviderRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    apiClient
      .get<{ providers: AdminProviderRow[] }>("/providers/admin", { status: "approved" })
      .then((data) => {
        if (!cancelled) setRows(data.providers)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load vets.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Vet Management</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Manage a clinic&apos;s appointments, availability, and fees on the vet&apos;s behalf.
        </p>
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
            <p className="font-body-sm text-body-sm text-on-surface-variant">No approved vets yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Clinic</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">City</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                <th className="px-space-md py-space-sm" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                  <td className="font-label-md text-label-md px-space-md py-space-sm font-semibold text-on-surface">{row.name}</td>
                  <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{row.city}</td>
                  <td className="px-space-md py-space-sm">
                    <StatusPill tone="success">{row.status}</StatusPill>
                  </td>
                  <td className="px-space-md py-space-sm text-right">
                    <Link href={`/vets/detail?id=${row.id}`} className="font-label-sm text-label-sm font-bold text-primary hover:underline">
                      Manage
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

export default VetsPage
