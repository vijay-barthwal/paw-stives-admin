"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/segments/button"
import { ConfirmDialog } from "@/components/segments/confirm-dialog"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { ApiError, apiClient } from "@/lib/api-client"

type WeightEntry = { id?: string; weightLbs?: number; weight?: number; recordedAt?: string }
type VaccinationEntry = { id?: string; name?: string; status?: string; administeredAt?: string | null; dueAt?: string | null }
type PrescriptionEntry = { id?: string; title?: string; name?: string; category?: string; docUrl?: string; createdAt?: string }

type PetDetail = {
  id: string
  name: string
  species: string
  breed?: string | null
  sex?: string | null
  dateOfBirth?: string | null
  weightLbs?: number | null
  microchipId?: string | null
  allergies?: string | null
  insuranceProvider?: string | null
  insurancePolicyId?: string | null
  ownerUserId?: string | null
  ownerName?: string | null
  ownerEmail?: string | null
  photoUrl?: string | null
  weightHistory?: WeightEntry[]
  vaccinations?: VaccinationEntry[]
  prescriptions?: PrescriptionEntry[]
  medicalDocuments?: PrescriptionEntry[]
}

function PetDetailView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const ownerNameFallback = searchParams.get("ownerName")
  const ownerEmailFallback = searchParams.get("ownerEmail")

  const [pet, setPet] = React.useState<PetDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(id))
  const [error, setError] = React.useState<string | null>(id ? null : "No pet was specified.")
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!id) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error at the start of a data fetch is intentional
    setIsLoading(true)
    setError(null)
    apiClient
      .get<PetDetail>(`/pets/${id}`)
      .then((data) => {
        if (!cancelled) setPet(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError && err.status === 404 ? "This pet could not be found." : "Something went wrong loading this pet.")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const handleDelete = async () => {
    if (!id) return
    setIsDeleting(true)
    setActionError(null)
    try {
      await apiClient.delete(`/pets/${id}`)
      router.push("/pets")
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't delete this pet.")
      setIsDeleting(false)
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

  if (error || !pet) {
    return (
      <div className="flex flex-col items-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-3xl text-center shadow-sm">
        <MaterialIcon name="search_off" size={32} className="text-on-surface-variant" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error}</p>
        <Link href="/pets" className="font-label-md text-label-md font-bold text-primary hover:underline">
          Back to pets
        </Link>
      </div>
    )
  }

  const ownerName = pet.ownerName ?? ownerNameFallback
  const ownerEmail = pet.ownerEmail ?? ownerEmailFallback
  const documents = pet.prescriptions ?? pet.medicalDocuments ?? []
  const weightHistory = pet.weightHistory ?? []
  const vaccinations = pet.vaccinations ?? []

  return (
    <div className="flex flex-col gap-space-lg">
      <button
        type="button"
        onClick={() => router.push("/pets")}
        className="font-label-sm text-label-sm flex w-fit items-center gap-space-3xs font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <MaterialIcon name="arrow_back" size={16} />
        Back to pets
      </button>

      <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-col gap-space-3xs">
            <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{pet.name || "Unnamed pet"}</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">
              {pet.species}
              {pet.breed ? ` • ${pet.breed}` : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => {
              setActionError(null)
              setConfirmOpen(true)
            }}
          >
            <MaterialIcon name="delete" size={16} />
            Delete pet
          </Button>
        </div>

        {actionError && (
          <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{actionError}</p>
        )}

        <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2 lg:grid-cols-3">
          {pet.sex && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant capitalize">
              <MaterialIcon name="pets" size={18} className="text-primary" />
              {pet.sex}
            </p>
          )}
          {pet.dateOfBirth && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="cake" size={18} className="text-primary" />
              Born {new Date(pet.dateOfBirth).toLocaleDateString()}
            </p>
          )}
          {pet.weightLbs != null && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="monitor_weight" size={18} className="text-primary" />
              {pet.weightLbs} lbs
            </p>
          )}
          {pet.microchipId && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="memory" size={18} className="text-primary" />
              Microchip {pet.microchipId}
            </p>
          )}
          {pet.allergies && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="warning" size={18} className="text-primary" />
              Allergies: {pet.allergies}
            </p>
          )}
          {(pet.insuranceProvider || pet.insurancePolicyId) && (
            <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
              <MaterialIcon name="health_and_safety" size={18} className="text-primary" />
              {pet.insuranceProvider ?? "Insured"}
              {pet.insurancePolicyId ? ` • ${pet.insurancePolicyId}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Owner</h2>
          {ownerName || ownerEmail ? (
            <div className="flex flex-col gap-space-2xs">
              {ownerName && (
                <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
                  <MaterialIcon name="person" size={18} className="text-primary" />
                  {ownerName}
                </p>
              )}
              {ownerEmail && (
                <p className="font-body-sm text-body-sm flex items-center gap-space-xs text-on-surface-variant">
                  <MaterialIcon name="mail" size={18} className="text-primary" />
                  {ownerEmail}
                </p>
              )}
            </div>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Owner details aren&apos;t available.</p>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Vaccinations</h2>
          {vaccinations.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No vaccination records yet.</p>
          ) : (
            <div className="flex flex-col gap-space-2xs">
              {vaccinations.map((vaccination, index) => (
                <div key={vaccination.id ?? index} className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">{vaccination.name ?? "Vaccination"}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {vaccination.status ?? (vaccination.administeredAt ? new Date(vaccination.administeredAt).toLocaleDateString() : "—")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Weight history</h2>
          {weightHistory.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No weight logs yet.</p>
          ) : (
            <div className="flex flex-col gap-space-2xs">
              {weightHistory.map((entry, index) => (
                <div key={entry.id ?? index} className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">{entry.weightLbs ?? entry.weight ?? "—"} lbs</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {entry.recordedAt ? new Date(entry.recordedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Prescriptions &amp; documents</h2>
          {documents.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">No records on file.</p>
          ) : (
            <div className="flex flex-col gap-space-2xs">
              {documents.map((doc, index) => (
                <div key={doc.id ?? index} className="flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-space-xs">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">{doc.title ?? doc.name ?? "Document"}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : (doc.category ?? "")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this pet?"
        description={`${pet.name || "This pet"}'s profile, medical records, and appointment history will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        error={actionError}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

export { PetDetailView }
