'use client'

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'

interface MDXContentProps {
  source: MDXRemoteSerializeResult
}

export function MDXContent({ source }: MDXContentProps) {
  return (
    <div className="prose dark:prose-invert max-w-none
      prose-headings:font-serif 
      prose-h1:text-2xl prose-h1:mb-8
      prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6
      prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4
      prose-p:text-zinc-600 prose-p:leading-relaxed
      prose-a:text-zinc-900 prose-a:underline hover:prose-a:text-zinc-600
      prose-code:text-zinc-700 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded
      prose-pre:bg-zinc-100 prose-pre:text-zinc-700
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
      <MDXRemote {...source} />
    </div>
  )
} 