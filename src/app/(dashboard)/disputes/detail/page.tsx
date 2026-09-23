import { Suspense } from "react"

import { DisputeDetailView } from "@/components/disputes/dispute-detail-view"

export default function DisputeDetailPage() {
  return (
    <Suspense fallback={null}>
      <DisputeDetailView />
    </Suspense>
  )
}
