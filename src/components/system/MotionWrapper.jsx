// MotionWrapper — entrada suave estilo Motion Primitives.
// Fade + rise 12px, ease [0.16,1,0.3,1], uma vez por viewport.
// Respeita prefers-reduced-motion (renderiza div estática).

import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1]

export default function MotionWrapper({
  children,
  delay = 0,
  y = 12,
  duration = 0.45,
  once = true,
  className = '',
  ...rest
}) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className} {...rest}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// Lista com stagger: envolva os itens em <MotionStagger> + <MotionItem>.
export function MotionStagger({ children, className = '', gap = 0.06, ...rest }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className} {...rest}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function MotionItem({ children, className = '', ...rest }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className} {...rest}>{children}</div>
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
