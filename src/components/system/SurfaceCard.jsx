// SurfaceCard — cartão do mock (fundo #1C211E, raio 20, sem borda, sem glow).
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-4',
  lg: 'p-5',
}

export default function SurfaceCard({
  as: Tag = 'section',
  padding = 'md',
  className = '',
  children,
  ...rest
}) {
  void rest.hoverGlow
  const { hoverGlow, ...tagProps } = rest
  return (
    <Tag
      {...tagProps}
      className={['relative overflow-hidden rounded-[20px] bg-card text-card-foreground', PADDING[padding] ?? PADDING.md, className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
}
