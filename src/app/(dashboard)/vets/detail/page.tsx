import { Suspense } from "react"

import { VetManagementView } from "@/components/vets/vet-management-view"

export default function VetDetailPage() {
  return (
    <Suspense fallback={null}>
      <VetManagementView />
    </Suspense>
  )
}
