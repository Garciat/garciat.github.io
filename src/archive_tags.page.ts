export const layout: SiteLayout = "layouts/archive_result.page.tsx";

export default function* (
  { search }: Lume.Data,
): Generator<Partial<Lume.Data>> {
  // Generate a page for each tag
  for (const tag of search.values<string>("tags")) {
    const title = `Posts tagged “${tag}”`;
    yield {
      url: `/archive/${tag}/`,
      type: "tag",
      search_query: `type=post '${tag}'`,
      title,
      tag,
      structuredData: [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              item: "site-url:/archive/",
              name: "Archive", // TODO: refer to page title
            },
            {
              "@type": "ListItem",
              position: 2,
              name: title,
            },
          ],
        } satisfies BreadcrumpListSD,
      ],
    };
  }
}
