import { Section, sectionOrder } from "@/data/section-order";
import { BlogPosts } from "@/components/sections/blog-posts";
import { ProfileSection } from "@/components/profile-section";
import { NewsEntry } from "@/components/news-entry";
import { EducationEntry } from "@/components/education-entry";
import { PublicationEntry } from "@/components/publication-entry";
import { ExperienceEntry } from "@/components/experience-entry";
import { PortfolioEntry } from "@/components/portfolio-entry";
import { BlogPostEntry } from "@/components/blog-post-entry";
import { aboutMe } from "@/data/aboutme";
import { newsData } from "@/data/news";
import { educationData } from "@/data/education";
import { publicationData } from "@/data/publication";
import { experienceData } from "@/data/experience";
import { portfolioData } from "@/data/portfolio";
import { blogPostData } from "@/data/blogposts";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-screen-lg mx-auto px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="col-span-12 md:col-span-4 space-y-12 mb-8 md:mb-0">
            <div className="md:sticky top-12 space-y-8">
              <ProfileSection aboutMe={aboutMe} />
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-6 space-y-24">
            {aboutMe.description && (
              <section>
                <p
                  className="font-serif text-sm leading-relaxed text-zinc-700 [&_a]:underline [&_a]:text-zinc-900 [&_a:hover]:text-zinc-600"
                  dangerouslySetInnerHTML={{ __html: aboutMe.description }}
                />
              </section>
            )}
            {sectionOrder.map((sectionName) => {
              switch (sectionName) {
                case Section.News:
                  return (
                    newsData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-l mb-12 tracking-wide uppercase">
                          News
                        </h2>
                        <div className="space-y-12">
                          {newsData.map((news, index) => (
                            <div key={index}>
                              <NewsEntry news={news} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )
                  );
                case Section.Education:
                  return (
                    educationData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-zinc-700 mb-12 tracking-wide uppercase">
                          Education
                        </h2>
                        <div className="space-y-12">
                          {educationData.map((education, index) => (
                            <EducationEntry key={index} education={education} />
                          ))}
                        </div>
                      </section>
                    )
                  );
                case Section.Publication:
                  return (
                    publicationData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-l mb-12 tracking-wide uppercase">
                          Publications
                        </h2>
                        <div className="space-y-12">
                          {publicationData.map((publication, index) => (
                            <div key={index}>
                              <PublicationEntry publication={publication} />
                              {index < publicationData.length - 1 && (
                                <div className="h-px bg-zinc-200 my-8" />
                              )}
                            </div>
                          ))}
                        </div>
                      </section>
                    )
                  );
                case Section.Experience:
                  return (
                    experienceData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-md mb-12 tracking-wide uppercase">
                          Experience
                        </h2>
                        <div className="space-y-12">
                          {experienceData.map((experience, index) => (
                            <ExperienceEntry
                              key={index}
                              experience={experience}
                            />
                          ))}
                        </div>
                      </section>
                    )
                  );
                case Section.Portfolio:
                  return (
                    portfolioData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-md mb-12 tracking-wide uppercase">
                          Portfolio
                        </h2>
                        <div className="space-y-12">
                          {portfolioData.map((portfolio, index) => (
                            <PortfolioEntry key={index} portfolio={portfolio} />
                          ))}
                        </div>
                      </section>
                    )
                  );
                case Section.BlogPosts:
                  return (
                    blogPostData.length > 0 && (
                      <section key={sectionName}>
                        <h2 className="font-serif text-l mb-12 tracking-wide uppercase">
                          Blog Posts
                        </h2>
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
                      </section>
                    )
                  );
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
