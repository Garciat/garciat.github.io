export const layout: SiteLayout = "layouts/archive_result.page.tsx";

export default function* ({ search }: Lume.Data) {
  // Generate a page for each tag
  for (const tag of search.values("tags")) {
    yield {
      url: `/archive/${tag}/`,
      title: `Posts tagged  “${tag}”`,
      type: "tag",
      search_query: `type=post '${tag}'`,
      tag,
    };
  }
}
