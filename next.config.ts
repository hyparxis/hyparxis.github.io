import type { NextConfig } from "next";
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  }
})

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'raw.githubusercontent.com',
      },
    ],
    unoptimized: true,
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
  trailingSlash: true,
}

export default withMDX(nextConfig)
