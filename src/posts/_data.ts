export const layout: SiteLayout = "layouts/post.page.tsx";

export const type = "post";

export const structuredData: BlogPostingSD = {
  "@type": "BlogPosting",
  url: "site-url:self",
  headline: "lume-data:title",
  author: "lume-data:config.data.author",
  datePublished: "lume-data:date",
  dateModified: "lume-data:dateModified",
};
