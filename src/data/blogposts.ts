export interface BlogPost {
  title: string;
  date: string;
  summary: string;
  url: string;
  imageUrl?: string;
}

export const blogPostData: BlogPost[] = [
  {
    title: "Example Blog Post",
    date: "2024-03-20",
    summary: "A brief description of what this blog post is about...",
    url: "https://example.com/blog-post",
    imageUrl: "/images/thumbnail.png", 
  },
  // Add more blog posts here
]; 