import { cn } from "cn"

type StatusPillTone = "success" | "warning" | "danger" | "info" | "neutral"

type StatusPillProps = {
  children: React.ReactNode
  tone?: StatusPillTone
  className?: string
}

const toneClasses: Record<StatusPillTone, string> = {
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300",
  warning: "bg-secondary-container text-on-secondary-container",
  danger: "bg-error-container text-on-error-container",
  info: "bg-tertiary-fixed text-on-tertiary-fixed",
  neutral: "bg-surface-container text-on-surface-variant",
}

/** Small uppercase status tag, e.g. "Confirmed", "Due Soon", "Up to Date". */
function StatusPill({ children, tone = "neutral", className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export { StatusPill }
