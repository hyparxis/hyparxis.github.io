import { getBlogPosts, BlogPostMeta } from '@/lib/blog'

export type BlogPost = BlogPostMeta

export const blogPostData = getBlogPosts() 