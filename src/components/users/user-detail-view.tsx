"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/segments/button"
import { ConfirmDialog } from "@/components/segments/confirm-dialog"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { ApiError, apiClient } from "@/lib/api-client"

type UserRole = "user" | "vet" | "admin" | "superadmin"
type UserStatus = "active" | "suspended"

type UserDetail = {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  petCount: number | null
  appointmentCount: number | null
}

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

function UserDetailView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [user, setUser] = React.useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(id))
  const [error, setError] = React.useState<string | null>(id ? null : "No user was specified.")
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [isActing, setIsActing] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const loadUser = React.useCallback(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    apiClient
      .get<UserDetail>(`/users/${id}`)
      .then(setUser)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? "This user could not be found." : "Something went wrong loading this user.")
      )
      .finally(() => setIsLoading(false))
  }, [id])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional
    loadUser()
  }, [loadUser])

  const nextStatus: UserStatus | null = user ? (user.status === "active" ? "suspended" : "active") : null

  const handleToggleStatus = async () => {
    if (!id || !nextStatus) return
    setIsActing(true)
    setActionError(null)
    try {
      const updated = await apiClient.patch<UserDetail>(`/users/${id}/status`, { status: nextStatus })
      setUser((current) => (current ? { ...current, ...updated } : updated))
      setConfirmOpen(false)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this user's status.")
    } finally {
      setIsActing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-md">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-3xl text-center shadow-sm">
        <MaterialIcon name="search_off" size={32} className="text-on-surface-variant" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <Link href="/users" className="font-label-md text-label-md font-bold text-primary hover:underline">
          Back to users
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <button
        type="button"
        onClick={() => router.push("/users")}
        className="font-label-sm text-label-sm flex w-fit items-center gap-space-3xs font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <MaterialIcon name="arrow_back" size={16} />
        Back to users
      </button>

      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-3xs">
            <div className="flex items-center gap-space-xs">
              <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{user.fullName || "Unnamed user"}</h1>
              <StatusPill tone={STATUS_TONE[user.status] ?? "neutral"}>{user.status ?? "unknown"}</StatusPill>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{ROLE_LABEL[user.role] ?? user.role}</p>
          </div>

          <Button
            type="button"
            variant={user.status === "active" ? "outline" : "default"}
            onClick={() => {
              setActionError(null)
              setConfirmOpen(true)
            }}
            className={user.status === "active" ? "border-destructive text-destructive hover:bg-destructive/10" : "bg-primary text-on-primary hover:bg-primary-container"}
          >
            <MaterialIcon name={user.status === "active" ? "block" : "check_circle"} size={16} />
            {user.status === "active" ? "Suspend account" : "Reactivate account"}
          </Button>
        </div>

        {actionError && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{actionError}</p>
        )}

        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="mail" size={18} className="text-primary" />
            {user.email}
          </p>
          {user.phone && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="call" size={18} className="text-primary" />
              {user.phone}
            </p>
          )}
          <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
            <MaterialIcon name="event" size={18} className="text-primary" />
            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
        <div className="flex flex-col gap-space-2xs rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <MaterialIcon name="pets" size={20} />
          </span>
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{user.petCount ?? "—"}</span>
          <span className="font-label-md text-label-md font-semibold text-on-surface-variant">Pets on file</span>
        </div>
        <div className="flex flex-col gap-space-2xs rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-xl bg-surface-container-high text-primary">
            <MaterialIcon name="calendar_month" size={20} />
          </span>
          <span className="font-headline-lg text-headline-lg font-bold text-on-surface">{user.appointmentCount ?? "—"}</span>
          <span className="font-label-md text-label-md font-semibold text-on-surface-variant">Appointments booked</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={user.status === "active" ? "Suspend this account?" : "Reactivate this account?"}
        description={
          user.status === "active"
            ? `${user.fullName || "This user"} will lose access to the platform until reactivated.`
            : `${user.fullName || "This user"} will regain access to the platform.`
        }
        confirmLabel={user.status === "active" ? "Suspend" : "Reactivate"}
        destructive={user.status === "active"}
        isConfirming={isActing}
        error={actionError}
        onConfirm={() => void handleToggleStatus()}
      />
    </div>
  )
}

export { UserDetailView }
