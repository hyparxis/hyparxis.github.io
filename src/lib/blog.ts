import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const postsDirectory = path.join(process.cwd(), 'src/content/blog')

export interface BlogPostMeta {
  title: string
  date: string
  summary: string
  slug: string
  imageUrl?: string
}

export function getBlogPosts(): BlogPostMeta[] {
  const fileNames = fs.readdirSync(postsDirectory)
  const posts = fileNames
    .filter(fileName => fileName.endsWith('.mdx'))
    .filter(fileName => !fileName.startsWith('_'))
    .map(fileName => {
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)
      
      return {
        slug: fileName.replace(/\.mdx$/, ''),
        title: data.title,
        date: data.date,
        summary: data.summary,
        imageUrl: data.imageUrl,
      }
    })
    
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
} 