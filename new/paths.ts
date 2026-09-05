import { parse } from "jsr:@std/path@1.1.6/parse";

import { Post } from "./data.ts";

export const paths = {
  base: "/",
  slugs: {
    assets: "assets",
    posts: "posts",
    post(post: Post) {
      return parse(post.path).name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    },
    rssFeed: "feed.xml",
    jsonFeed: "feed.json",
  },
  home() {
    return this.base;
  },
  rssFeed() {
    return `${this.base}${this.slugs.rssFeed}` as const;
  },
  jsonFeed() {
    return `${this.base}${this.slugs.jsonFeed}` as const;
  },
  post(post: Post) {
    return `${this.base}${this.slugs.posts}/${this.slugs.post(post)}/` as const;
  },
  asset(path: `/${string}`) {
    return `${this.base}${this.slugs.assets}${path}` as const;
  },
} as const;
