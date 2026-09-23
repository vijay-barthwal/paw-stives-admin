"use client"

import { Button } from "@/components/segments/button"
import { MaterialIcon } from "@/components/segments/material-icon"

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

/** Simple prev/next pager used by every paginated admin list. */
function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  if (total <= 0) return null
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-surface-container px-space-md py-space-sm">
      <span className="font-label-sm text-label-sm text-on-surface-variant">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-space-xs">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <MaterialIcon name="chevron_left" size={16} />
          Prev
        </Button>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          Page {page} of {pageCount}
        </span>
        <Button type="button" variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
          <MaterialIcon name="chevron_right" size={16} />
        </Button>
      </div>
    </div>
  )
}

export { Pagination }
