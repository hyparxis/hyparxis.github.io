'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBanner() {
  const pathname = usePathname();

  return (
    <div className="py-5 bg-[#FFFCF8]">
      <div className="max-w-screen-lg mx-auto px-8 flex items-center justify-center">
        <div className="flex space-x-16">
          <Link 
            href="/blog" 
            className={`relative py-1 text-sm font-sans tracking-wide ${
              pathname === '/' || pathname.startsWith('/blog')
                ? 'text-zinc-800 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-zinc-300' 
                : 'text-zinc-500'
            } hover:text-zinc-800 transition-colors`}
          >
            Blog
          </Link>
          
          <Link 
            href="/about" 
            className={`relative py-1 text-sm font-sans tracking-wide ${
              pathname.startsWith('/about')
                ? 'text-zinc-800 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-zinc-300' 
                : 'text-zinc-500'
            } hover:text-zinc-800 transition-colors`}
          >
            About Me
          </Link>
        </div>
      </div>
    </div>
  );
} 