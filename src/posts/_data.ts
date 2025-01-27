export const layout: SiteLayout = "layouts/post.page.tsx";

export const type = "post";

export const structuredData: BlogPostingSD = {
  "@type": "BlogPosting",
  url: "site-url:self",
  headline: "lume-data:title",
  datePublished: "lume-data:date",
  dateModified: "lume-data:dateModified",
  description: "lume-data:description",
  keywords: "lume-data:tags",
  timeRequired: "lume-data:readingInfo.minutes | iso8601minutes",
  wordCount: "lume-data:readingInfo.words",
  author: "lume-data:config.data.author",
};
