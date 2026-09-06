import { parse } from "jsr:@std/path@1.1.6/parse";

import { Page, Post } from "./data.ts";

export const paths = {
  base: "/",

  slugs: {
    page(page: Page) {
      return parse(page.path).name;
    },

    posts: "posts",
    post(post: Post) {
      return parse(post.path).name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    },

    rssFeed: "feed.xml",
    jsonFeed: "feed.json",

    assets: "assets",
  },

  home() {
    return this.base;
  },

  page(page: Page) {
    return `${this.base}${this.slugs.page(page)}/` as const;
  },
  pageBySlug(slug: string) {
    return `${this.base}${slug}/` as const;
  },

  post(post: Post) {
    return `${this.base}${this.slugs.posts}/${this.slugs.post(post)}/` as const;
  },

  rssFeed() {
    return `${this.base}${this.slugs.rssFeed}` as const;
  },
  jsonFeed() {
    return `${this.base}${this.slugs.jsonFeed}` as const;
  },

  asset(path: `/${string}`) {
    return `${this.base}${this.slugs.assets}${path}` as const;
  },
} as const;
