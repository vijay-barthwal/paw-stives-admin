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

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

type ClinicDetail = {
  id: string
  ownerUserId: string | null
  name: string
  category: string
  description: string | null
  phone: string | null
  email: string | null
  address: { line1: string; line2: string | null; city: string; state: string | null; postalCode: string | null; country: string }
  latitude: number
  longitude: number
  tags: string[]
  rating: number
  reviewCount: number
  status: "pending" | "approved" | "rejected"
  rejectionReason: string | null
  isOpenNow: boolean
  openStatusLabel: string
  hours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[]
  services: { id: string; name: string; price: number; durationMinutes: number | null }[]
  photoUrls: string[]
}

const STATUS_TONE: Record<ClinicDetail["status"], "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
}

function ClinicReviewView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [clinic, setClinic] = React.useState<ClinicDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(id))
  const [error, setError] = React.useState<string | null>(id ? null : "No clinic was specified.")
  const [isActing, setIsActing] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState("")
  const [showRejectForm, setShowRejectForm] = React.useState(false)

  const loadClinic = React.useCallback(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    apiClient
      .get<ClinicDetail>(`/providers/${id}`)
      .then(setClinic)
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? "This clinic could not be found." : "Something went wrong loading this clinic."))
      .finally(() => setIsLoading(false))
  }, [id])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional (also re-used to refresh after approve/reject)
    loadClinic()
  }, [loadClinic])

  const handleApprove = async () => {
    if (!id) return
    setIsActing(true)
    setActionError(null)
    try {
      await apiClient.patch(`/providers/${id}/status`, { status: "approved" })
      loadClinic()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to approve this clinic.")
    } finally {
      setIsActing(false)
    }
  }

  const handleReject = async () => {
    if (!id || !rejectionReason.trim()) return
    setIsActing(true)
    setActionError(null)
    try {
      await apiClient.patch(`/providers/${id}/status`, { status: "rejected", rejectionReason: rejectionReason.trim() })
      setShowRejectForm(false)
      loadClinic()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject this clinic.")
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-md">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !clinic) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-3xl text-center shadow-sm">
        <MaterialIcon name="search_off" size={32} className="text-on-surface-variant" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <Link href="/providers" className="font-label-md text-label-md font-bold text-primary hover:underline">
          Back to queue
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <button
        type="button"
        onClick={() => router.push("/providers")}
        className="font-label-sm text-label-sm flex w-fit items-center gap-space-3xs font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <MaterialIcon name="arrow_back" size={16} />
        Back to queue
      </button>

      <div className="flex flex-col gap-space-xs rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-3xs">
            <div className="flex items-center gap-space-xs">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{clinic.name}</h1>
              <StatusPill tone={STATUS_TONE[clinic.status]}>{clinic.status}</StatusPill>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{clinic.category}</p>
          </div>

          {clinic.status !== "approved" && (
            <div className="flex items-center gap-space-xs">
              <Button type="button" variant="outline" onClick={() => setShowRejectForm((current) => !current)} disabled={isActing}>
                <MaterialIcon name="close" size={16} />
                Reject
              </Button>
              <Button
                type="button"
                onClick={handleApprove}
                disabled={isActing}
                className="bg-primary text-on-primary hover:bg-primary-container"
              >
                <MaterialIcon name="check" size={16} />
                Approve
              </Button>
            </div>
          )}
        </div>

        {clinic.rejectionReason && clinic.status === "rejected" && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">
            Previously rejected: {clinic.rejectionReason}
          </p>
        )}

        {showRejectForm && (
          <div className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
            <Textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Reason for rejection (required, shown to the clinic owner)"
              className="min-h-20 rounded-xl border-transparent bg-surface-container-lowest px-space-md py-space-sm"
            />
            <Button type="button" disabled={isActing || !rejectionReason.trim()} onClick={handleReject} className="self-end bg-destructive text-white hover:bg-destructive/90">
              Confirm Rejection
            </Button>
          </div>
        )}

        {actionError && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{actionError}</p>
        )}

        {clinic.description && <p className="font-body-md text-body-md text-on-surface-variant">{clinic.description}</p>}

        <div className="flex flex-wrap items-center gap-space-3xs pt-space-2xs">
          {clinic.tags.length === 0 && <span className="font-label-sm text-label-sm text-on-surface-variant">No highlights set</span>}
          {clinic.tags.map((tag) => (
            <StatusPill key={tag} tone="neutral">
              {tag.replace(/-/g, " ")}
            </StatusPill>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Contact &amp; Location</h2>
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="location_on" size={18} className="text-primary" />
            {clinic.address.line1}
            {clinic.address.line2 ? `, ${clinic.address.line2}` : ""}, {clinic.address.city}
            {clinic.address.state ? `, ${clinic.address.state}` : ""} {clinic.address.postalCode ?? ""}
          </p>
          {clinic.phone && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="call" size={18} className="text-primary" />
              {clinic.phone}
            </p>
          )}
          {clinic.email && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="mail" size={18} className="text-primary" />
              {clinic.email}
            </p>
          )}
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="my_location" size={18} className="text-primary" />
            {clinic.latitude}, {clinic.longitude}
          </p>
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Hours</h2>
          {clinic.tags.includes("emergency-24-7") ? (
            <p className="font-label-md text-label-md font-semibold text-primary">Open 24/7</p>
          ) : (
            <div className="flex flex-col gap-1">
              {DAY_LABELS.map((label, dayOfWeek) => {
                const hour = clinic.hours.find((row) => row.dayOfWeek === dayOfWeek)
                const isClosed = !hour || hour.isClosed || !hour.openTime || !hour.closeTime
                return (
                  <div key={label} className="flex items-center justify-between py-1">
                    <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {isClosed ? "Closed" : `${hour.openTime} – ${hour.closeTime}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm lg:col-span-2">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Services &amp; Pricing</h2>
          {clinic.services.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No services listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-space-2xs sm:grid-cols-2 lg:grid-cols-3">
              {clinic.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{service.name}</span>
                    {service.durationMinutes && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{service.durationMinutes} mins</span>
                    )}
                  </div>
                  <span className="font-label-md text-label-md font-bold text-primary">${service.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { ClinicReviewView }
