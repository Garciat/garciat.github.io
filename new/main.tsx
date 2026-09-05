import { directory, file, index, jsx, site } from "deno-static/mod.ts";

import { computeSiteData } from "./data.ts";
import { paths } from "./paths.ts";
import { treeMap, withTimeTag } from "./utils.ts";

import { IndexPage } from "./pages/index.tsx";
import { PostPage } from "./pages/post.tsx";

const data = await withTimeTag(
  computeSiteData(),
  (tag) => console.log(`[data]`, "done", `(${tag})`),
);

await site(() => ({
  [index]: jsx(<IndexPage posts={data.posts} />),
  [paths.slugs.posts]: treeMap(
    data.posts,
    (post) => paths.slugs.post(post),
    (post) => ({ [index]: jsx(<PostPage post={post} />) }),
  ),
  [paths.slugs.rss]: file(data.feeds.rss),
  [paths.slugs.assets]: directory(import.meta.resolve("./assets")),
}));
