"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useAdminSession } from "@/components/auth/admin-session-provider"
import { Button } from "@/components/segments/button"
import { MaterialIcon } from "@/components/segments/material-icon"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/segments/sheet"
import { ThemeToggle } from "@/components/segments/theme-toggle"

const NAV_LINKS = [
  { label: "Dashboard", href: "/", icon: "space_dashboard" },
  { label: "Clinic Approvals", href: "/providers", icon: "verified" },
  { label: "Users", href: "/users", icon: "group" },
  { label: "Service Categories", href: "/service-categories", icon: "category" },
  { label: "Reports", href: "/reports", icon: "monitoring" },
  { label: "Disputes", href: "/disputes", icon: "gavel" },
] as const

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  return (
    <nav className="flex flex-col gap-space-3xs">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={`font-label-md text-label-md flex items-center gap-space-xs rounded-xl px-space-sm py-2.5 font-semibold transition-colors ${
            isActive(link.href)
              ? "bg-primary text-on-primary shadow-sm"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <MaterialIcon name={link.icon} size={20} />
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status, user, logout } = useAdminSession()
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)

  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login")
  }, [status, router])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-surface">
        <MaterialIcon name="progress_activity" size={28} className="animate-spin text-on-surface-variant" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-surface">
      <aside className="hidden w-64 shrink-0 flex-col gap-space-lg border-r border-surface-container bg-surface-container-lowest p-space-md lg:flex">
        <div className="flex items-center gap-space-xs px-space-xs">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
            <MaterialIcon name="pets" size={20} />
          </span>
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Pawstives Admin</span>
        </div>
        <NavList pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-space-sm border-b border-surface-container bg-surface-container-lowest px-gutter-mobile lg:px-gutter-desktop">
          <div className="flex items-center gap-space-xs lg:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Open menu">
                  <MaterialIcon name="menu" size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-4/5 max-w-xs flex-col gap-0 p-0">
                <SheetHeader className="border-b border-surface-container p-space-md">
                  <SheetTitle className="flex items-center gap-space-xs">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
                      <MaterialIcon name="pets" size={18} />
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">Pawstives Admin</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-space-lg overflow-y-auto p-space-md">
                  <SheetClose asChild>
                    <div>
                      <NavList pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                    </div>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Signed in as <strong className="text-on-surface">{user?.fullName}</strong>
          </span>

          <div className="flex items-center gap-space-xs">
            <span className="font-label-sm text-label-sm rounded-full bg-secondary-container/40 px-space-sm py-1 font-bold tracking-wider text-on-secondary-container uppercase">
              {user?.role}
            </span>
            <ThemeToggle />
            <Button type="button" variant="ghost" size="icon" aria-label="Log out" onClick={handleLogout}>
              <MaterialIcon name="logout" size={20} />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-gutter-mobile lg:p-gutter-desktop">{children}</main>
      </div>
    </div>
  )
}

export { DashboardShell }
