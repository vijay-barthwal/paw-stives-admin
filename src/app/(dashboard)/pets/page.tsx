"use client"

import * as React from "react"
import Link from "next/link"

import { MaterialIcon } from "@/components/segments/material-icon"
import { Pagination } from "@/components/segments/pagination"
import { Skeleton } from "@/components/segments/skeleton"
import { apiClient } from "@/lib/api-client"

type PetRow = {
  id: string
  name: string
  species: string
  breed: string | null
  ownerUserId: string | null
  ownerName: string | null
  ownerEmail: string | null
  createdAt: string
}

type PetsResponse = {
  data: PetRow[]
  total: number
  page: number
  pageSize: number
}

const SPECIES_OPTIONS = [
  { value: "", label: "All species" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "exotic", label: "Exotic" },
] as const

const PAGE_SIZE = 20

function PetsPage() {
  const [queryInput, setQueryInput] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [species, setSpecies] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [rows, setRows] = React.useState<PetRow[]>([])
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
      .get<PetsResponse>("/pets/admin", {
        query: query || undefined,
        species: species || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((data) => {
        if (cancelled) return
        setRows(Array.isArray(data?.data) ? data.data : [])
        setTotal(typeof data?.total === "number" ? data.total : 0)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load pets.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query, species, page])

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col gap-space-2xs">
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Pets</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Every pet passport on the platform, with a link back to its owner.</p>
      </div>

      <div className="flex flex-wrap items-center gap-space-xs">
        <div className="relative min-w-56 flex-1">
          <MaterialIcon name="search" size={18} className="absolute top-1/2 left-space-sm -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="Search by pet name, breed, or owner"
            className="font-body-sm text-body-sm h-10 w-full rounded-xl border border-transparent bg-surface-container-low py-2 pr-space-sm pl-9 text-on-surface outline-none focus-visible:border-primary"
          />
        </div>
        <select
          value={species}
          onChange={(event) => {
            setSpecies(event.target.value)
            setPage(1)
          }}
          className="font-label-sm text-label-sm h-10 rounded-xl border border-surface-container bg-surface-container-low px-space-sm text-on-surface"
        >
          {SPECIES_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
            <MaterialIcon name="pets" size={26} className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">No pets match this view.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-container">
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Pet</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Species / Breed</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Owner</th>
                  <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                    <td className="px-space-md py-space-sm">
                      <Link
                        href={`/pets/detail?id=${row.id}${row.ownerName ? `&ownerName=${encodeURIComponent(row.ownerName)}` : ""}${
                          row.ownerEmail ? `&ownerEmail=${encodeURIComponent(row.ownerEmail)}` : ""
                        }`}
                        className="font-label-md text-label-md font-semibold text-on-surface hover:text-primary hover:underline"
                      >
                        {row.name || "Unnamed pet"}
                      </Link>
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant capitalize">
                      {row.species}
                      {row.breed ? ` • ${row.breed}` : ""}
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      <div className="flex flex-col">
                        <span>{row.ownerName ?? "Unknown owner"}</span>
                        {row.ownerEmail && <span>{row.ownerEmail}</span>}
                      </div>
                    </td>
                    <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
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

export default PetsPage
