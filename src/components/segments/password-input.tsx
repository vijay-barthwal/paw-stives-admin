"use client"

import * as React from "react"

import { Input } from "@/components/segments/input"
import { MaterialIcon } from "@/components/segments/material-icon"

function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative flex items-center">
      <Input {...props} type={visible ? "text" : "password"} className={className} />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
      >
        <MaterialIcon name={visible ? "visibility_off" : "visibility"} size={18} />
      </button>
    </div>
  )
}

export { PasswordInput }
