import { Suspense } from "react"

import { UserDetailView } from "@/components/users/user-detail-view"

export default function UserDetailPage() {
  return (
    <Suspense fallback={null}>
      <UserDetailView />
    </Suspense>
  )
}
