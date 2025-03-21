'use client'

import React, { useState, useEffect } from 'react'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

interface MDXContentProps {
  source: MDXRemoteSerializeResult
}

export function MDXContent({ source }: MDXContentProps) {
  const [content, setContent] = useState<React.ReactElement | null>(null)
  
  useEffect(() => {
    // Only import MDXRemote on the client side
    import('next-mdx-remote').then(({ MDXRemote }) => {
      setContent(
        <MDXRemote 
          {...source}
          components={{
            h1: ({ children, ...props }) => (
              <h1 id={children?.toString().toLowerCase()} {...props}>{children}</h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 id={children?.toString().toLowerCase()} {...props}>{children}</h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 id={children?.toString().toLowerCase()} {...props}>{children}</h3>
            ),
          }}
        />
      )
    })
  }, [source])
  
  return (
    <div className="prose dark:prose-invert max-w-none
      prose-headings:font-sans prose-headings:tracking-wide prose-headings:text-zinc-700
      prose-h1:text-2xl prose-h1:mb-8
      prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6
      prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:font-serif
      prose-a:text-zinc-900 prose-a:underline hover:prose-a:text-zinc-600
      prose-code:text-zinc-700 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded
      prose-pre:bg-zinc-100 prose-pre:text-zinc-700 prose-pre:p-4
      [&_pre]:bg-zinc-100 [&_pre]:rounded-lg [&_pre]:overflow-x-auto
      [&_code]:bg-transparent [&_code]:p-0
      prose-img:rounded-lg
      prose-strong:text-zinc-700
      prose-ul:list-disc prose-ul:pl-4
      prose-ol:list-decimal prose-ol:pl-4
      prose-li:text-zinc-600 prose-li:my-1
      prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-600
      [&_.math]:py-1
      [&_.katex]:text-zinc-600 [&_.katex]:text-[1.25em]
      [&_.katex-display]:py-1
      [&_.katex]:break-words
      [&_.katex-html]:break-words
      [&_.katex-html]:leading-relaxed
      [&_.katex-html_.tag]:hidden
      [&_p+.math]:mt-0
      [&_.math+p]:mt-0
      [&_.katex-display]:overflow-hidden
    ">
      {content || <div className="animate-pulse">Loading content...</div>}
    </div>
  )
} 