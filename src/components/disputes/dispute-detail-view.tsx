"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/segments/button"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { Textarea } from "@/components/segments/textarea"
import { ApiError, apiClient } from "@/lib/api-client"

type DisputeStatus = "open" | "investigating" | "resolved" | "dismissed"

type DisputeDetail = {
  id: string
  appointmentId: string | null
  providerId: string | null
  providerName: string | null
  raisedByUserId: string | null
  raisedByRole: string | null
  subject: string
  description: string
  status: DisputeStatus
  resolutionNotes: string | null
  resolvedByUserId: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  appointmentDate: string | null
  petName: string | null
  ownerName: string | null
}

const STATUS_TONE: Record<DisputeStatus, "warning" | "info" | "success" | "neutral"> = {
  open: "warning",
  investigating: "info",
  resolved: "success",
  dismissed: "neutral",
}

type PendingAction = "investigating" | "resolved" | "dismissed" | null

function DisputeDetailView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [dispute, setDispute] = React.useState<DisputeDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(id))
  const [error, setError] = React.useState<string | null>(id ? null : "No dispute was specified.")

  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null)
  const [resolutionNotes, setResolutionNotes] = React.useState("")
  const [isActing, setIsActing] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const loadDispute = React.useCallback(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    apiClient
      .get<DisputeDetail>(`/disputes/${id}`)
      .then(setDispute)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "This dispute could not be found." : "Something went wrong loading this dispute.")
      )
      .finally(() => setIsLoading(false))
  }, [id])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional
    loadDispute()
  }, [loadDispute])

  const requiresNotes = pendingAction === "resolved" || pendingAction === "dismissed"

  const submitStatusChange = async (status: Exclude<DisputeStatus, "open">) => {
    if (!id) return
    if ((status === "resolved" || status === "dismissed") && !resolutionNotes.trim()) {
      setActionError("Resolution notes are required to resolve or dismiss a dispute.")
      return
    }
    setIsActing(true)
    setActionError(null)
    try {
      const updated = await apiClient.patch<DisputeDetail>(`/disputes/${id}/status`, {
        status,
        resolutionNotes: resolutionNotes.trim() || undefined,
      })
      setDispute((current) => (current ? { ...current, ...updated } : updated))
      setPendingAction(null)
      setResolutionNotes("")
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this dispute.")
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-md">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !dispute) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-3xl text-center shadow-sm">
        <MaterialIcon name="search_off" size={32} className="text-on-surface-variant" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <Link href="/disputes" className="font-label-md text-label-md font-bold text-primary hover:underline">
          Back to disputes
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <button
        type="button"
        onClick={() => router.push("/disputes")}
        className="font-label-sm text-label-sm flex w-fit items-center gap-space-3xs font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <MaterialIcon name="arrow_back" size={16} />
        Back to disputes
      </button>

      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-3xs">
            <div className="flex items-center gap-space-xs">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{dispute.subject || "Untitled dispute"}</h1>
              <StatusPill tone={STATUS_TONE[dispute.status] ?? "neutral"}>{dispute.status ?? "unknown"}</StatusPill>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Raised {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "recently"}
              {dispute.raisedByRole ? ` by ${dispute.raisedByRole}` : ""}
            </p>
          </div>

          {(dispute.status === "open" || dispute.status === "investigating") && (
            <div className="flex flex-wrap items-center gap-space-xs">
              {dispute.status === "open" && (
                <Button type="button" variant="outline" disabled={isActing} onClick={() => void submitStatusChange("investigating")}>
                  <MaterialIcon name="search" size={16} />
                  Start investigating
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                disabled={isActing}
                onClick={() => {
                  setActionError(null)
                  setResolutionNotes(dispute.resolutionNotes ?? "")
                  setPendingAction("dismissed")
                }}
              >
                <MaterialIcon name="close" size={16} />
                Dismiss
              </Button>
              <Button
                type="button"
                disabled={isActing}
                onClick={() => {
                  setActionError(null)
                  setResolutionNotes(dispute.resolutionNotes ?? "")
                  setPendingAction("resolved")
                }}
                className="bg-primary text-on-primary hover:bg-primary-container"
              >
                <MaterialIcon name="check" size={16} />
                Resolve
              </Button>
            </div>
          )}
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant">{dispute.description}</p>

        {pendingAction && (
          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
            <span className="font-label-sm text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">
              Resolution notes {requiresNotes ? "(required)" : ""}
            </span>
            <Textarea
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              placeholder="Explain the outcome and any next steps for the provider or pet owner"
              className="min-h-24 rounded-xl border-transparent bg-surface-container-lowest px-space-md py-space-sm"
            />
            <div className="flex items-center gap-space-xs self-end">
              <Button type="button" variant="ghost" size="sm" disabled={isActing} onClick={() => setPendingAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isActing || (requiresNotes && !resolutionNotes.trim())}
                onClick={() => void submitStatusChange(pendingAction)}
                className={pendingAction === "dismissed" ? "bg-destructive text-white hover:bg-destructive/90" : "bg-primary text-on-primary hover:bg-primary-container"}
              >
                {isActing ? "Saving…" : pendingAction === "dismissed" ? "Confirm dismissal" : pendingAction === "resolved" ? "Confirm resolution" : "Confirm"}
              </Button>
            </div>
          </div>
        )}

        {actionError && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{actionError}</p>
        )}

        {!pendingAction && dispute.resolutionNotes && (dispute.status === "resolved" || dispute.status === "dismissed") && (
          <div className="flex flex-col gap-space-3xs rounded-xl bg-surface-container-low px-space-md py-space-sm">
            <span className="font-label-sm text-label-sm font-bold tracking-wider text-on-surface-variant uppercase">Resolution notes</span>
            <p className="font-body-sm text-body-sm text-on-surface">{dispute.resolutionNotes}</p>
            {dispute.resolvedAt && (
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Closed {new Date(dispute.resolvedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Context</h2>
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="storefront" size={18} className="text-primary" />
            {dispute.providerName ?? "Unknown provider"}
            {dispute.providerId && (
              <Link href={`/vets/detail?id=${dispute.providerId}`} className="text-primary hover:underline">
                Open clinic
              </Link>
            )}
          </p>
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="pets" size={18} className="text-primary" />
            {dispute.petName ?? "Unknown pet"}
          </p>
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="person" size={18} className="text-primary" />
            {dispute.ownerName ?? "Unknown owner"}
          </p>
          {dispute.appointmentDate && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="event" size={18} className="text-primary" />
              Appointment on {new Date(dispute.appointmentDate).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Timeline</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Submitted {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "—"}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Last updated {dispute.updatedAt ? new Date(dispute.updatedAt).toLocaleString() : "—"}
          </p>
          {dispute.resolvedAt && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Closed {new Date(dispute.resolvedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export { DisputeDetailView }
