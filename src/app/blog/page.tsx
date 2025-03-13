import { blogPostData } from "@/data/blogposts";
import Image from "next/image";
import Link from "next/link";

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-screen-lg mx-auto px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column - Used for spacing to match blog post layout */}
          <div className="col-span-12 md:col-span-3 mb-8 md:mb-0">
            {/* Empty for consistency */}
          </div>

          {/* Right Column - Content */}
          <div className="col-span-12 md:col-span-8 md:col-start-4">
            <div className="space-y-8">
              {blogPostData.map((post, index) => (
                <div key={index} className="group">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="flex flex-col sm:flex-row gap-6">
                      {post.imageUrl && (
                        <div className="w-full sm:w-1/4 min-w-[120px] overflow-hidden rounded-lg">
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            width={160}
                            height={160}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <p className="text-xs text-zinc-500 font-sans tracking-wide">
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        
                        <h2 className="font-serif text-xl text-zinc-800 group-hover:text-zinc-600 transition-colors">
                          {post.title}
                        </h2>
                        
                        <p className="text-sm text-zinc-600 leading-relaxed font-serif">
                          {post.summary}
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  {index < blogPostData.length - 1 && (
                    <div className="h-px bg-zinc-100 my-8" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 