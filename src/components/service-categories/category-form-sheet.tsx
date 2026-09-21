"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/segments/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/segments/form"
import { Input } from "@/components/segments/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/segments/sheet"
import { Textarea } from "@/components/segments/textarea"
import { ApiError } from "@/lib/api-client"
import {
  serviceCategoryDefaultValues,
  serviceCategorySchema,
  type ServiceCategoryValues,
} from "@/lib/validation/service-category"

type ServiceCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  suggestedMinPrice: number | null
  suggestedMaxPrice: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

type CategoryFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ServiceCategory | null
  onSubmit: (values: ServiceCategoryValues) => Promise<void>
}

function CategoryFormSheet({ open, onOpenChange, category, onSubmit }: CategoryFormSheetProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<ServiceCategoryValues>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: serviceCategoryDefaultValues,
  })

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the previous submit error when the sheet opens is intentional
    setSubmitError(null)
    form.reset(
      category
        ? {
            name: category.name,
            description: category.description ?? "",
            suggestedMinPrice: category.suggestedMinPrice ?? undefined,
            suggestedMaxPrice: category.suggestedMaxPrice ?? undefined,
            isActive: category.isActive,
          }
        : serviceCategoryDefaultValues
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the sheet opens or the target category changes
  }, [open, category])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Couldn't save this category.")
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 overflow-y-auto">
        <SheetHeader className="border-b border-surface-container">
          <SheetTitle>{category ? "Edit category" : "Add category"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-space-md p-space-md">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Grooming" className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Optional description shown to providers" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-space-sm">
              <FormField
                control={form.control}
                name="suggestedMinPrice"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Suggested min ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={value ?? ""}
                        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="suggestedMaxPrice"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Suggested max ($)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={value ?? ""}
                        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                        type="number"
                        min="0"
                        step="0.01"
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-center gap-space-xs">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="size-4"
                    />
                    <span className="font-label-md text-label-md font-semibold text-on-surface">Active (visible to providers)</span>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <p className="font-body-sm text-body-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">{submitError}</p>
            )}

            <SheetFooter className="mt-auto px-0 pt-space-md">
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-on-primary hover:bg-primary-container">
                {isSubmitting ? "Saving…" : category ? "Save changes" : "Add category"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

export { CategoryFormSheet }
export type { ServiceCategory }
