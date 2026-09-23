import { Suspense } from "react"

import { PetDetailView } from "@/components/pets/pet-detail-view"

export default function PetDetailPage() {
  return (
    <Suspense fallback={null}>
      <PetDetailView />
    </Suspense>
  )
}
