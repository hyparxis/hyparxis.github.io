import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { BlogPost } from "@/data/blogposts";

export function BlogPostEntry({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-col sm:flex-row gap-6">
      {post.imageUrl && (
        <div className="w-full sm:w-1/4 min-w-[160px] relative">
          <Image
            src={post.imageUrl}
            alt={post.title}
            width={160}
            height={200}
            className="rounded-lg transition-all duration-300"
          />
        </div>
      )}
      <div className="flex flex-col flex-1">
        <div className="flex flex-row gap-4 items-center mb-2">
          <p className="text-xs text-zinc-500">{post.date}</p>
        </div>
        <h3 className="font-serif text-md mb-3">{post.title}</h3>
        <p className="text-sm text-zinc-600 mb-4">{post.summary}</p>
        <div className="flex flex-row gap-6">
          <a
            href={post.url}
            className="group inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors duration-300"
          >
            <ArrowUpRight
              size={12}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300"
            />
            <span className="tracking-wider uppercase">Read More</span>
          </a>
        </div>
      </div>
    </div>
  );
} 