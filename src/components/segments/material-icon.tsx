import { cn } from "cn"

type MaterialIconProps = {
  name: string
  className?: string
  size?: number
  filled?: boolean
}

/**
 * Renders a Material Symbols Outlined icon by ligature name, e.g.
 * <MaterialIcon name="pets" />. The font is loaded via <link> tags in the
 * root layout (see RootLayout) since next/font/google can't express its
 * variable FILL/wght/GRAD/opsz axes.
 */
function MaterialIcon({ name, className, size = 20, filled = false }: MaterialIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined inline-block leading-none", className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
      }}
    >
      {name}
    </span>
  )
}

export { MaterialIcon }
