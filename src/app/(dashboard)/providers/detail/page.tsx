import { Suspense } from "react"

import { ClinicReviewView } from "@/components/providers/clinic-review-view"

export default function ProviderDetailPage() {
  return (
    <Suspense fallback={null}>
      <ClinicReviewView />
    </Suspense>
  )
}
