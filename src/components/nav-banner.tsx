'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBanner() {
  const pathname = usePathname();
  
  return (
    <div className="border-b border-zinc-100 py-5 sticky top-0 bg-[#FFFCF8] z-10 shadow-sm backdrop-blur-sm bg-opacity-95">
      <div className="max-w-screen-lg mx-auto px-8 flex items-center justify-between">
        <Link 
          href="/" 
          className="font-serif text-xl text-zinc-800 hover:text-zinc-600 transition-colors"
        >
          <span className="tracking-tight">Home</span>
        </Link>
        
        <div className="flex space-x-10">
          <Link 
            href="/blog" 
            className={`relative py-1 text-sm font-sans tracking-wide ${
              pathname.startsWith('/blog') 
                ? 'text-zinc-800 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-zinc-300' 
                : 'text-zinc-500'
            } hover:text-zinc-800 transition-colors`}
          >
            Blog
          </Link>
          
          <Link 
            href="/#about" 
            className={`relative py-1 text-sm font-sans tracking-wide ${
              pathname === '/' 
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