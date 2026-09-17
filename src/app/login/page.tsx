"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useAdminSession } from "@/components/auth/admin-session-provider"
import { LoginForm } from "@/components/auth/login-form"
import { MaterialIcon } from "@/components/segments/material-icon"

export default function LoginPage() {
  const router = useRouter()
  const { status } = useAdminSession()

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/")
  }, [status, router])

  if (status !== "unauthenticated") return null

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-space-xl bg-surface-container-low px-gutter-mobile py-space-2xl">
      <div className="flex flex-col items-center gap-space-2xs">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-md">
          <MaterialIcon name="shield_person" size={26} />
        </span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Pawstives Admin</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">Platform team console</p>
      </div>
      <LoginForm />
    </div>
  )
}
