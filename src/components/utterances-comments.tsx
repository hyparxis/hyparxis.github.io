'use client'

import { useEffect, useRef, useState } from 'react'

interface UtterancesCommentsProps {
  repo: string
  issueTerm: string
  label?: string
  theme?: 'github-light' | 'github-dark' | 'preferred-color-scheme'
}

export function UtterancesComments({
  repo,
  issueTerm = 'pathname',
  label = '',
  theme = 'github-light'
}: UtterancesCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Wait for component to be mounted and stable in the DOM
    if (!containerRef.current) return
    
    // Clean up any previous instance
    const cleanup = () => {
      const utterancesFrame = document.querySelector('.utterances-frame')
      if (utterancesFrame) {
        utterancesFrame.remove()
      }
    }
    
    // Clean up before adding a new script
    cleanup()
    
    // Reduced delay to just enough time to ensure DOM stability
    const timer = setTimeout(() => {
      // Create the script element
      const script = document.createElement('script')
      script.src = 'https://utteranc.es/client.js'
      script.async = true
      script.defer = true
      script.setAttribute('repo', repo)
      script.setAttribute('issue-term', issueTerm)
      script.setAttribute('theme', theme)
      
      if (label) {
        script.setAttribute('label', label)
      }
      
      script.setAttribute('crossorigin', 'anonymous')
      
      // Track loading state
      script.onload = () => setLoaded(true)
      
      // Ensure the container still exists before adding
      if (containerRef.current) {
        containerRef.current.appendChild(script)
      }
    }, 30) // Reduced from 100ms to 30ms
    
    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [repo, issueTerm, label, theme])

  return (
    <div className="utterances-comments mt-4 relative min-h-[150px]" ref={containerRef}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-sm text-zinc-400">Loading comments...</div>
        </div>
      )}
    </div>
  )
} 