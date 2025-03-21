import { getBlogPosts } from '@/lib/blog'
import { serialize } from 'next-mdx-remote/serialize'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import { MDXContent } from '@/components/mdx-content'
import { UtterancesComments } from '@/components/utterances-comments'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export async function generateStaticParams() {
  const posts = getBlogPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

// Update for Next.js 15 compatibility
type Params = Promise<{ slug: string }>;

export default async function BlogPost({
  params,
}: {
  params: Params
}) {
  // Await the params to get the slug
  const { slug } = await params
  
  const filePath = path.join(process.cwd(), 'src/content/blog', `${slug}.mdx`)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const { content, data } = matter(fileContent)
  
  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkMath
      ],
      rehypePlugins: [
        [rehypeKatex, {
          output: 'html',
          throwOnError: true,
          strict: false,
          trust: true,
          macros: {
            "\\eqref": "\\href{###1}{(\\text{#1})}",
          },
          displayMode: true,
          leqno: false,
          fleqn: false,
        }],
        [rehypePrettyCode, {
          theme: 'github-light',
          keepBackground: false,
        }]
      ],
    },
  })
  
  return (
    <div className="min-h-screen">
      <div className="max-w-screen-lg mx-auto px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column - Back Button */}
          <div className="col-span-12 md:col-span-3 mb-8 md:mb-0">
            <div className="md:sticky top-12">
              <Link 
                href="/"
                className="group inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors duration-300"
              >
                <ArrowLeft
                  size={12}
                  className="group-hover:-translate-x-0.5 transition-transform duration-300"
                />
                <span className="tracking-wider uppercase">Back</span>
              </Link>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="col-span-12 md:col-span-8 md:col-start-4">
            <article>
              <header className="mb-12">
                <h1 className="font-serif text-2xl mb-4">{data.title}</h1>
                <div className="text-xs text-zinc-500">{data.date}</div>
              </header>
              <MDXContent source={mdxSource} />
              
              {/* Comments Section */}
              <div className="mt-8 pt-4 border-t border-zinc-100">
                <UtterancesComments 
                  repo="hyparxis/hyparxis.github.io" 
                  issueTerm="pathname"
                  theme="github-light"
                />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
} 