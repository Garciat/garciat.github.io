import {
  directory,
  file,
  index,
  jsx,
  response,
  site,
  treeMap,
} from "deno-static/mod.ts";

import { computeSiteData } from "./data.ts";
import { paths } from "./paths.ts";
import { withTimeTag } from "./utils.ts";

import { IndexPage } from "./_jsx/index.tsx";
import { PagePage } from "./_jsx/page.tsx";
import { PostPage } from "./_jsx/post.tsx";

const data = await withTimeTag(
  computeSiteData(),
  (tag) => console.log(`[data]`, "done", `(${tag})`),
);

await site(async () => ({
  "favicon.ico": file(import.meta.resolve("./assets/favicon.ico")),

  [index]: jsx(<IndexPage pages={data.pages} posts={data.posts} />),

  ...await treeMap(
    data.pages,
    (page) => paths.slugs.page(page),
    (page) => ({ [index]: jsx(<PagePage page={page} />) }),
  ),

  [paths.slugs.posts]: treeMap(
    data.posts,
    (post) => paths.slugs.post(post),
    (post) => ({ [index]: jsx(<PostPage post={post} />) }),
  ),

  [paths.slugs.rssFeed]: response(data.feeds.rss),
  [paths.slugs.jsonFeed]: response(data.feeds.json),

  [paths.slugs.assets]: directory(import.meta.resolve("./assets")),
}));
