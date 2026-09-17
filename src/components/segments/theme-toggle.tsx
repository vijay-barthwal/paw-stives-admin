"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/segments/button"
import { MaterialIcon } from "@/components/segments/material-icon"

function useHasMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHasMounted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark mode"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-full text-on-surface-variant hover:text-on-surface"
    >
      {mounted ? (
        <MaterialIcon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} size={20} />
      ) : (
        <span className="size-5" />
      )}
    </Button>
  )
}

export { ThemeToggle }
