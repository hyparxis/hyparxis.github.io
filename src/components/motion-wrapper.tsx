'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionWrapperProps {
  children: ReactNode
  isBackNavigation?: boolean
}

export function MotionWrapper({ children, isBackNavigation = false }: MotionWrapperProps) {
  return (
    <motion.div
      initial={{ x: isBackNavigation ? '-100%' : '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: isBackNavigation ? '100%' : '-100%', opacity: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 70,
        damping: 15,
        mass: 0.5
      }}
      layout
    >
      {children}
    </motion.div>
  )
} 