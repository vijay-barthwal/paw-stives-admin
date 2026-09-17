import { MaterialIcon } from "@/components/segments/material-icon"

function PlaceholderPage({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-space-sm rounded-2xl bg-surface-container-lowest p-space-3xl text-center shadow-sm">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
        <MaterialIcon name={icon} size={28} />
      </span>
      <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">{title}</h1>
      <p className="font-body-sm text-body-sm max-w-md text-on-surface-variant">{description}</p>
      <span className="font-label-sm text-label-sm rounded-full bg-secondary-container/40 px-space-sm py-1 font-bold tracking-wider text-on-secondary-container uppercase">
        Coming Soon
      </span>
    </div>
  )
}

export { PlaceholderPage }
