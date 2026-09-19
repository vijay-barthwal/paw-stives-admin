"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/segments/button"
import { Input } from "@/components/segments/input"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { Textarea } from "@/components/segments/textarea"
import { ApiError, apiClient } from "@/lib/api-client"

type ClinicSummary = {
  id: string
  name: string
  phone: string | null
  email: string | null
  status: "pending" | "approved" | "rejected"
  services: { id: string; name: string; price: number; durationMinutes: number | null }[]
}

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed"

type AppointmentRow = {
  id: string
  status: AppointmentStatus
  scheduledAt: string
  durationMinutes: number
  notes: string | null
  serviceName: string
  servicePrice: number
  cancelledByRole: string | null
  cancellationReason: string | null
  createdByRole: string
  pet: { id: string; name: string; species: string; breed: string | null } | null
  owner: { id: string; fullName: string; phone: string | null; email: string } | null
}

type BlackoutSlot = {
  id: string
  date: string
  startTime: string | null
  endTime: string | null
  wholeDay: boolean
  reason: string | null
}

type CustomerSearchResult = {
  id: string
  fullName: string
  phone: string | null
  email: string
  pets: { id: string; name: string; species: string }[]
}

const STATUS_TONE: Record<AppointmentStatus, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  confirmed: "success",
  cancelled: "danger",
  completed: "neutral",
}

const TABS = [
  { id: "appointments", label: "Appointments" },
  { id: "availability", label: "Availability" },
  { id: "new-appointment", label: "New Appointment" },
] as const

function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

function formatScheduledAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  const timeLabel = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" })
  return `${dateLabel} • ${timeLabel}`
}

function todayUtcDateInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

function AppointmentsTab({ clinicId }: { clinicId: string }) {
  const [appointments, setAppointments] = React.useState<AppointmentRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [editingFeeId, setEditingFeeId] = React.useState<string | null>(null)
  const [feeInput, setFeeInput] = React.useState("")
  const [actionError, setActionError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { appointments: rows } = await apiClient.get<{ appointments: AppointmentRow[] }>(`/appointments/provider/${clinicId}`)
      setAppointments(rows)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load appointments.")
    } finally {
      setIsLoading(false)
    }
  }, [clinicId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load()
  }, [load])

  const applyUpdate = (updated: AppointmentRow) => {
    setAppointments((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  const updateStatus = async (appointment: AppointmentRow, status: Exclude<AppointmentStatus, "pending">) => {
    setBusyId(appointment.id)
    setActionError(null)
    try {
      const updated = await apiClient.patch<AppointmentRow>(`/appointments/${appointment.id}/status`, { status })
      applyUpdate(updated)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this appointment.")
    } finally {
      setBusyId(null)
    }
  }

  const startEditFee = (appointment: AppointmentRow) => {
    setEditingFeeId(appointment.id)
    setFeeInput(String(appointment.servicePrice))
  }

  const saveFee = async (appointment: AppointmentRow) => {
    const price = Number(feeInput)
    if (!Number.isFinite(price) || price < 0) {
      setActionError("Enter a valid fee.")
      return
    }
    setBusyId(appointment.id)
    setActionError(null)
    try {
      const updated = await apiClient.patch<AppointmentRow>(`/appointments/${appointment.id}/fee`, { price })
      applyUpdate(updated)
      setEditingFeeId(null)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update the fee.")
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-space-xs">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }
  if (error) {
    return <p className="font-body-sm text-body-sm text-destructive">{error}</p>
  }

  return (
    <div className="flex flex-col gap-space-sm">
      {actionError && <p className="font-label-sm text-label-sm font-semibold text-destructive">{actionError}</p>}
      {appointments.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">No appointments booked at this clinic yet.</p>
      ) : (
        appointments.map((appointment) => (
          <div key={appointment.id} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-xs">
              <StatusPill tone={STATUS_TONE[appointment.status]}>{appointment.status}</StatusPill>
              {appointment.createdByRole !== "user" && (
                <span className="font-label-sm text-label-sm text-on-surface-variant">Assigned by {appointment.createdByRole}</span>
              )}
            </div>
            <p className="font-body-md text-body-md font-semibold text-on-surface">{formatScheduledAt(appointment.scheduledAt)}</p>
            <div className="font-body-sm text-body-sm flex flex-wrap items-center gap-x-space-md gap-y-space-3xs text-on-surface-variant">
              <span>{appointment.pet?.name ?? "Unknown patient"}</span>
              {editingFeeId === appointment.id ? (
                <span className="flex items-center gap-space-2xs">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={feeInput}
                    onChange={(event) => setFeeInput(event.target.value)}
                    className="h-7 w-24"
                  />
                  <Button type="button" size="xs" disabled={busyId === appointment.id} onClick={() => void saveFee(appointment)}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" size="xs" onClick={() => setEditingFeeId(null)}>
                    Cancel
                  </Button>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  {appointment.serviceName} • ${appointment.servicePrice.toFixed(2)}
                  <button type="button" onClick={() => startEditFee(appointment)} className="text-primary hover:underline" aria-label="Edit fee">
                    <MaterialIcon name="edit" size={14} />
                  </button>
                </span>
              )}
              {appointment.owner && <span>{appointment.owner.fullName}</span>}
              {appointment.owner?.phone && (
                <>
                  <a href={`tel:${appointment.owner.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <MaterialIcon name="call" size={14} />
                    {appointment.owner.phone}
                  </a>
                  <a
                    href={whatsappLink(appointment.owner.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <MaterialIcon name="chat" size={14} />
                    WhatsApp
                  </a>
                </>
              )}
            </div>
            {appointment.status === "pending" && (
              <div className="flex items-center gap-space-xs">
                <Button type="button" size="sm" disabled={busyId === appointment.id} onClick={() => void updateStatus(appointment, "confirmed")}>
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId === appointment.id}
                  onClick={() => void updateStatus(appointment, "cancelled")}
                >
                  Decline
                </Button>
              </div>
            )}
            {appointment.status === "confirmed" && (
              <div className="flex items-center gap-space-xs">
                <Button type="button" size="sm" disabled={busyId === appointment.id} onClick={() => void updateStatus(appointment, "completed")}>
                  Mark Complete
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busyId === appointment.id}
                  onClick={() => void updateStatus(appointment, "cancelled")}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function AvailabilityTab({ clinicId }: { clinicId: string }) {
  const [slots, setSlots] = React.useState<BlackoutSlot[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [date, setDate] = React.useState("")
  const [wholeDay, setWholeDay] = React.useState(true)
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { blackoutSlots } = await apiClient.get<{ blackoutSlots: BlackoutSlot[] }>(`/providers/${clinicId}/blackout-slots`)
      setSlots(blackoutSlots)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load availability.")
    } finally {
      setIsLoading(false)
    }
  }, [clinicId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void load()
  }, [load])

  const handleAdd = async () => {
    setSubmitError(null)
    if (!date) {
      setSubmitError("Pick a date to block.")
      return
    }
    if (!wholeDay && (!startTime || !endTime)) {
      setSubmitError("Pick both a start and end time, or block the whole day.")
      return
    }
    setIsSubmitting(true)
    try {
      const created = await apiClient.post<BlackoutSlot>(`/providers/${clinicId}/blackout-slots`, {
        date,
        wholeDay,
        startTime: wholeDay ? undefined : startTime,
        endTime: wholeDay ? undefined : endTime,
        reason: reason.trim() || undefined,
      })
      setSlots((current) => [...current, created].sort((a, b) => a.date.localeCompare(b.date)))
      setDate("")
      setWholeDay(true)
      setStartTime("")
      setEndTime("")
      setReason("")
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't block that time.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await apiClient.delete(`/providers/${clinicId}/blackout-slots/${id}`)
      setSlots((current) => current.filter((slot) => slot.id !== id))
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't remove that block.")
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />
  if (error) return <p className="font-body-sm text-body-sm text-destructive">{error}</p>

  return (
    <div className="flex flex-col gap-space-sm">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Block a full day or a specific time range on top of the clinic&apos;s regular weekly hours.
      </p>
      <div className="flex flex-wrap items-end gap-space-sm rounded-lg bg-surface-container-low p-space-sm">
        <label className="flex flex-col gap-space-3xs">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Date</span>
          <Input type="date" value={date} min={todayUtcDateInputValue()} onChange={(event) => setDate(event.target.value)} className="h-10 w-40" />
        </label>
        <label className="flex items-center gap-space-2xs pb-1.5">
          <input type="checkbox" checked={wholeDay} onChange={(event) => setWholeDay(event.target.checked)} className="size-4" />
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Block whole day</span>
        </label>
        {!wholeDay && (
          <>
            <label className="flex flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Start</span>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="h-10 w-32" />
            </label>
            <label className="flex flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">End</span>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="h-10 w-32" />
            </label>
          </>
        )}
        <label className="flex flex-1 flex-col gap-space-3xs">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Reason (optional)</span>
          <Input type="text" value={reason} onChange={(event) => setReason(event.target.value)} className="h-10" />
        </label>
        <Button type="button" disabled={isSubmitting} onClick={() => void handleAdd()}>
          <MaterialIcon name="add" size={16} />
          Block
        </Button>
      </div>
      {submitError && <p className="font-label-sm text-label-sm font-semibold text-destructive">{submitError}</p>}
      <div className="flex flex-col gap-space-xs">
        {slots.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">No blocked days or time slots yet.</p>
        ) : (
          slots.map((slot) => (
            <div key={slot.id} className="flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-low px-space-sm py-space-xs">
              <div className="flex flex-col gap-space-3xs">
                <span className="font-label-md text-label-md font-semibold text-on-surface">{slot.date}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {slot.wholeDay ? "Closed all day" : `${slot.startTime} – ${slot.endTime}`}
                  {slot.reason ? ` • ${slot.reason}` : ""}
                </span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemove(slot.id)}>
                Remove
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function NewAppointmentTab({ clinic }: { clinic: ClinicSummary }) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<CustomerSearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerSearchResult | null>(null)
  const [selectedPetId, setSelectedPetId] = React.useState("")
  const [walkInName, setWalkInName] = React.useState("")
  const [walkInPhone, setWalkInPhone] = React.useState("")
  const [newPetName, setNewPetName] = React.useState("")
  const [newPetSpecies, setNewPetSpecies] = React.useState("dog")
  const [serviceId, setServiceId] = React.useState("")
  const [customServiceName, setCustomServiceName] = React.useState("")
  const [price, setPrice] = React.useState("")
  const [durationMinutes, setDurationMinutes] = React.useState("30")
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const needsNewPet = !selectedCustomer || !selectedPetId

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const { customers } = await apiClient.get<{ customers: CustomerSearchResult[] }>("/appointments/customers/search", { query })
      setResults(customers)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't search customers.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleServiceChange = (value: string) => {
    setServiceId(value)
    const service = clinic.services.find((entry) => entry.id === value)
    if (service) {
      setPrice(String(service.price))
      setDurationMinutes(String(service.durationMinutes ?? 30))
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)
    setNotice(null)

    if (!date || !time) {
      setSubmitError("Pick a date and time.")
      return
    }
    const parsedPrice = Number(price)
    const parsedDuration = Number(durationMinutes)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setSubmitError("Enter a valid fee.")
      return
    }
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      setSubmitError("Enter a valid length in minutes.")
      return
    }

    const body: Record<string, unknown> = {
      providerId: clinic.id,
      date,
      time,
      price: parsedPrice,
      durationMinutes: parsedDuration,
      notes: notes.trim() || undefined,
    }
    if (serviceId) body.serviceId = serviceId
    else body.serviceName = customServiceName.trim() || "Appointment"

    if (selectedCustomer && selectedPetId) {
      body.petId = selectedPetId
    } else {
      if (!newPetName.trim()) {
        setSubmitError("Enter the pet's name.")
        return
      }
      body.pet = { name: newPetName.trim(), species: newPetSpecies }
      if (selectedCustomer) body.customer = { userId: selectedCustomer.id }
      else {
        if (!walkInName.trim() || !walkInPhone.trim()) {
          setSubmitError("Enter the customer's name and phone number.")
          return
        }
        body.customer = { fullName: walkInName.trim(), phone: walkInPhone.trim() }
      }
    }

    setIsSubmitting(true)
    try {
      await apiClient.post("/appointments/provider", body)
      setNotice("Appointment booked.")
      setDate("")
      setTime("")
      setNotes("")
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't book this appointment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-space-md">
      <section className="flex flex-col gap-space-sm">
        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Customer</h3>
        {selectedCustomer ? (
          <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-lg bg-surface-container-low px-space-sm py-space-xs">
            <div className="flex flex-col gap-space-3xs">
              <span className="font-label-md text-label-md font-semibold text-on-surface">{selectedCustomer.fullName}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{selectedCustomer.phone ?? "No phone on file"}</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedCustomer(null); setSelectedPetId(""); setQuery("") }}>
              Change
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <Input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, phone, or email" className="h-10" />
              <Button type="button" variant="outline" disabled={isSearching} onClick={() => void handleSearch()}>
                Search
              </Button>
            </div>
            {results.length > 0 && (
              <div className="flex flex-col gap-space-3xs rounded-lg bg-surface-container-low p-space-2xs">
                {results.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer)
                      setSelectedPetId(customer.pets[0]?.id ?? "")
                      setResults([])
                      setQuery(customer.fullName)
                    }}
                    className="flex flex-col gap-space-3xs rounded-md px-space-sm py-space-xs text-left hover:bg-surface-container"
                  >
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{customer.fullName}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {customer.phone ?? "No phone"} • {customer.pets.length} pet{customer.pets.length === 1 ? "" : "s"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant">No match? Fill in walk-in details below.</p>
          </div>
        )}

        {selectedCustomer && selectedCustomer.pets.length > 0 && (
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Pet</span>
            <select
              value={selectedPetId}
              onChange={(event) => setSelectedPetId(event.target.value)}
              className="h-10 rounded-lg border border-input bg-transparent px-space-sm"
            >
              {selectedCustomer.pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
              <option value="">+ Add a new pet</option>
            </select>
          </label>
        )}

        {!selectedCustomer && (
          <div className="flex flex-wrap gap-space-sm">
            <label className="flex flex-1 flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Customer name</span>
              <Input type="text" value={walkInName} onChange={(event) => setWalkInName(event.target.value)} className="h-10" />
            </label>
            <label className="flex flex-1 flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Phone</span>
              <Input type="tel" value={walkInPhone} onChange={(event) => setWalkInPhone(event.target.value)} className="h-10" />
            </label>
          </div>
        )}

        {needsNewPet && (
          <div className="flex flex-wrap gap-space-sm">
            <label className="flex flex-1 flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Pet name</span>
              <Input type="text" value={newPetName} onChange={(event) => setNewPetName(event.target.value)} className="h-10" />
            </label>
            <label className="flex flex-col gap-space-3xs">
              <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Species</span>
              <select
                value={newPetSpecies}
                onChange={(event) => setNewPetSpecies(event.target.value)}
                className="h-10 rounded-lg border border-input bg-transparent px-space-sm"
              >
                {["dog", "cat", "bird", "exotic"].map((species) => (
                  <option key={species} value={species}>
                    {species}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-space-sm">
        <h3 className="font-label-lg text-label-lg font-bold text-on-surface">Visit Details</h3>
        <label className="flex flex-col gap-space-3xs">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Service</span>
          <select
            value={serviceId}
            onChange={(event) => handleServiceChange(event.target.value)}
            className="h-10 rounded-lg border border-input bg-transparent px-space-sm"
          >
            <option value="">Custom appointment</option>
            {clinic.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — ${service.price.toFixed(2)}
              </option>
            ))}
          </select>
        </label>
        {!serviceId && (
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Appointment name</span>
            <Input type="text" value={customServiceName} onChange={(event) => setCustomServiceName(event.target.value)} className="h-10" />
          </label>
        )}
        <div className="flex flex-wrap gap-space-sm">
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Fee ($)</span>
            <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} className="h-10 w-32" />
          </label>
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Length (minutes)</span>
            <Input type="number" min="1" step="5" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} className="h-10 w-32" />
          </label>
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Date</span>
            <Input type="date" value={date} min={todayUtcDateInputValue()} onChange={(event) => setDate(event.target.value)} className="h-10 w-40" />
          </label>
          <label className="flex flex-col gap-space-3xs">
            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Time</span>
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-10 w-32" />
          </label>
        </div>
        <label className="flex flex-col gap-space-3xs">
          <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Notes (optional)</span>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>
      </section>

      {submitError && <p className="font-label-sm text-label-sm font-semibold text-destructive">{submitError}</p>}
      {notice && <p className="font-label-sm text-label-sm font-semibold text-emerald-600">{notice}</p>}

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Admin's "Vet Management" detail view — mirrors the vet's own provider
 * dashboard so an admin can operate a clinic on the vet's behalf: view and
 * act on appointments (with call/WhatsApp contact), block off availability,
 * and assign new appointments directly.
 */
function VetManagementView() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [clinic, setClinic] = React.useState<ClinicSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(Boolean(id))
  const [error, setError] = React.useState<string | null>(id ? null : "No clinic was specified.")
  const [tab, setTab] = React.useState<(typeof TABS)[number]["id"]>("appointments")

  React.useEffect(() => {
    if (!id) return
    let cancelled = false
    apiClient
      .get<ClinicSummary>(`/providers/${id}`)
      .then((data) => {
        if (!cancelled) setClinic(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load this clinic.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (error || !clinic) {
    return (
      <div className="flex flex-col items-center gap-space-xs rounded-2xl bg-surface-container-lowest p-space-2xl text-center">
        <MaterialIcon name="error" size={26} className="text-destructive" />
        <p className="font-body-sm text-body-sm text-on-surface-variant">{error ?? "Clinic not found."}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">{clinic.name}</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {clinic.phone ?? "No phone on file"} {clinic.email ? `• ${clinic.email}` : ""}
        </p>
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

      <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm lg:p-space-lg">
        {tab === "appointments" && <AppointmentsTab clinicId={clinic.id} />}
        {tab === "availability" && <AvailabilityTab clinicId={clinic.id} />}
        {tab === "new-appointment" && <NewAppointmentTab clinic={clinic} />}
      </div>
    </div>
  )
}

export { VetManagementView }
