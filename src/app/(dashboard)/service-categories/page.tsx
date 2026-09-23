"use client"

import * as React from "react"

import { Button } from "@/components/segments/button"
import { ConfirmDialog } from "@/components/segments/confirm-dialog"
import { MaterialIcon } from "@/components/segments/material-icon"
import { Skeleton } from "@/components/segments/skeleton"
import { StatusPill } from "@/components/segments/status-pill"
import { CategoryFormSheet, type ServiceCategory } from "@/components/service-categories/category-form-sheet"
import { ApiError, apiClient } from "@/lib/api-client"
import type { ServiceCategoryValues } from "@/lib/validation/service-category"

function formatPriceRange(category: ServiceCategory): string {
  const { suggestedMinPrice: min, suggestedMaxPrice: max } = category
  if (min == null && max == null) return "No suggested range"
  if (min != null && max != null) return `$${min.toFixed(2)} – $${max.toFixed(2)}`
  if (min != null) return `From $${min.toFixed(2)}`
  return `Up to $${max?.toFixed(2)}`
}

function ServiceCategoriesPage() {
  const [categories, setCategories] = React.useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<ServiceCategory | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<ServiceCategory | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    setIsLoading(true)
    setError(null)
    apiClient
      .get<ServiceCategory[]>("/service-categories")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load service categories."))
      .finally(() => setIsLoading(false))
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    load()
  }, [load])

  const openCreate = () => {
    setEditingCategory(null)
    setSheetOpen(true)
  }

  const openEdit = (category: ServiceCategory) => {
    setEditingCategory(category)
    setSheetOpen(true)
  }

  const handleFormSubmit = async (values: ServiceCategoryValues) => {
    const body = {
      name: values.name,
      description: values.description?.trim() || undefined,
      suggestedMinPrice: values.suggestedMinPrice,
      suggestedMaxPrice: values.suggestedMaxPrice,
      isActive: values.isActive,
    }
    if (editingCategory) {
      const updated = await apiClient.patch<ServiceCategory>(`/service-categories/${editingCategory.id}`, body)
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } else {
      const created = await apiClient.post<ServiceCategory>("/service-categories", body)
      setCategories((current) => [...current, created])
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await apiClient.delete(`/service-categories/${deleteTarget.id}`)
      setCategories((current) => current.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete this category.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-col gap-space-2xs">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Service Categories</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Define the service categories providers can list under, with platform-wide suggested pricing.
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="bg-primary text-on-primary hover:bg-primary-container">
          <MaterialIcon name="add" size={16} />
          Add category
        </Button>
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
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-space-xs p-space-2xl text-center">
            <MaterialIcon name="category" size={26} className="text-on-surface-variant" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">No service categories yet. Add the first one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-container">
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Category</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Suggested range</th>
                <th className="font-label-sm text-label-sm px-space-md py-space-sm font-bold tracking-wider text-on-surface-variant uppercase">Status</th>
                <th className="px-space-md py-space-sm" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-surface-container last:border-0 hover:bg-surface-container-low">
                  <td className="px-space-md py-space-sm">
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">{category.name}</span>
                      {category.description && <span className="font-body-sm text-body-sm text-on-surface-variant">{category.description}</span>}
                    </div>
                  </td>
                  <td className="font-body-sm text-body-sm px-space-md py-space-sm text-on-surface-variant">{formatPriceRange(category)}</td>
                  <td className="px-space-md py-space-sm">
                    <StatusPill tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Active" : "Inactive"}</StatusPill>
                  </td>
                  <td className="px-space-md py-space-sm text-right">
                    <div className="flex items-center justify-end gap-space-sm">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        className="font-label-sm text-label-sm font-bold text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(category)
                        }}
                        className="font-label-sm text-label-sm font-bold text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CategoryFormSheet open={sheetOpen} onOpenChange={setSheetOpen} category={editingCategory} onSubmit={handleFormSubmit} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete this category?"
        description={deleteTarget ? `"${deleteTarget.name}" will no longer be available for providers to select.` : undefined}
        confirmLabel="Delete"
        destructive
        isConfirming={isDeleting}
        error={deleteError}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

export default ServiceCategoriesPage
