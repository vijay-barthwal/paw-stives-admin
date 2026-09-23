"use client"

import * as React from "react"
import { cn } from "cn"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"

import { Button } from "@/components/segments/button"

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isConfirming?: boolean
  error?: string | null
  onConfirm: () => void
}

/** Centered confirmation modal for destructive/state-changing admin actions (suspend, delete, status changes). */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isConfirming = false,
  error,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <AlertDialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-container-lowest p-space-lg shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
        >
          <AlertDialogPrimitive.Title className="font-headline-sm text-headline-sm font-bold text-on-surface">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="font-body-sm text-body-sm mt-space-xs text-on-surface-variant">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          {error && (
            <p className="font-body-sm text-body-sm mt-space-sm rounded-xl bg-error-container px-space-md py-space-sm text-on-error-container">
              {error}
            </p>
          )}
          <div className="mt-space-lg flex justify-end gap-space-xs">
            <AlertDialogPrimitive.Cancel asChild>
              <Button type="button" variant="outline" disabled={isConfirming}>
                {cancelLabel}
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              className={
                destructive
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-primary text-on-primary hover:bg-primary-container"
              }
            >
              {isConfirming ? "Working…" : confirmLabel}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { ConfirmDialog }
