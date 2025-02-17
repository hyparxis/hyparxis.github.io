import { Section } from "@/data/section-order";
import { blogPostData } from "@/data/blogposts";
import { BlogPostEntry } from "@/components/blog-post-entry";

export function BlogPosts() {
  return (
    <section id={Section.BlogPosts} className="scroll-mt-16">
      <h2 className="font-serif text-xl mb-8">Blog Posts</h2>
      <div className="space-y-8">
        {blogPostData.map((post, index) => (
          <BlogPostEntry key={index} post={post} />
        ))}
      </div>
    </section>
  );
} 