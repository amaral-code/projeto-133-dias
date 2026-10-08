// SurfaceCard — card base dark-first (Origin UI / shadcn).
// zinc-950 no app, superfície zinc-900/60 + backdrop-blur-md + borda 1px white/[0.08].
// Hover: leve iluminação (overlay branco 2% + borda 14%), sem gradiente colorido.

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
}

export default function SurfaceCard({
  as: Tag = 'section',
  padding = 'md',
  hoverGlow = true,
  className = '',
  children,
  ...rest
}) {
  return (
    <Tag
      {...rest}
      className={[
        'group relative overflow-hidden rounded-xl border',
        // light / dark
        'border-zinc-200 bg-white',
        'dark:border-white/[0.08] dark:bg-[#1C211E]/60 dark:backdrop-blur-md dark:shadow-[0_1px_2px_rgb(0_0_0/0.4)]',
        // hover: iluminação sutil
        hoverGlow
          ? 'transition-colors duration-200 dark:hover:border-white/[0.14] dark:hover:bg-[#232A23]/80 hover:border-zinc-300'
          : '',
        PADDING[padding] ?? PADDING.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* hairline superior: luz de topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06] dark:bg-white/[0.06]"
      />
      {/* glow no hover */}
      {hoverGlow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-white/[0.02] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  )
}
