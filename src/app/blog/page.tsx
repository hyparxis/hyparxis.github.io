import { blogPostData } from "@/data/blogposts";
import { BlogPostEntry } from "@/components/blog-post-entry";
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
            {/* Removed title and description */}
            
            <div className="space-y-12">
              {blogPostData.map((post, index) => (
                <div key={index}>
                  <BlogPostEntry post={post} />
                  {index < blogPostData.length - 1 && (
                    <div className="h-px bg-zinc-200 my-8" />
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