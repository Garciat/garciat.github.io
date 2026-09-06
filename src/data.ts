import { helpers } from "deno-static/mod.ts";
import { Article, loadArticles } from "deno-static/articles.ts";

import { Feed } from "npm:feed@6.0.0";
import z from "npm:zod@4.5.4";

import { SiteConfig } from "./config.ts";
import { paths } from "./paths.ts";

const PageMetaSchema = z.object({
  title: z.string(),
  description: z.optional(z.string().trim()),
});

const PostMetaSchema = z.object({
  title: z.string(),
  date: z.date().transform((date) => date.toTemporalInstant()),
  tags: z.array(z.string()),
  description: z.optional(z.string().trim()),
});

type PageMeta = z.output<typeof PageMetaSchema>;
type PostMeta = z.output<typeof PostMetaSchema>;

export type Page = Awaited<ReturnType<typeof preparePage>>;
export type Post = Awaited<ReturnType<typeof preparePost>>;

export async function computeSiteData() {
  const pages = await loadPages();

  const posts = await loadPosts();

  const feed = buildFeed(posts);

  return {
    pages,
    posts,
    feeds: {
      rss: feed.rss2(),
      json: feed.json1(),
    },
  };
}

async function loadPages() {
  const articles = await loadArticles(
    import.meta.resolve("./pages"),
    PageMetaSchema,
    { extensions: [".md"] },
  );

  return await Promise.all(articles.map(preparePage));
}

function preparePage({ path, meta, body }: Article<PageMeta>) {
  return {
    path,
    meta,
    body,
    info: {
      readingInfo: readingInfo(body),
    },
  };
}

async function loadPosts() {
  const articles = await loadArticles(
    import.meta.resolve("./posts"),
    PostMetaSchema,
    { extensions: [".md"] },
  );

  return await Promise.all(articles.map(preparePost));
}

function preparePost({ path, meta, body }: Article<PostMeta>) {
  return {
    path,
    meta,
    body,
    info: {
      readingInfo: readingInfo(body),
    },
  };
}

function readingInfo(content: string) {
  const segmenter = new Intl.Segmenter(SiteConfig.language, {
    granularity: "word",
  });

  let wordCount = 0;
  for (const word of segmenter.segment(content)) {
    if (word.isWordLike) {
      wordCount++;
    }
  }

  return {
    duration: Temporal.Duration.from({
      minutes: Math.ceil(wordCount / SiteConfig.readingWPM),
    }),
  };
}

function buildFeed(posts: Post[]): Feed {
  const feed = new Feed({
    title: SiteConfig.title,
    description: SiteConfig.description,
    language: SiteConfig.language,
    link: helpers.url(paths.home(), true),
    feedLinks: {
      rss: helpers.url(paths.rssFeed(), true),
    },
  });

  for (const post of posts) {
    feed.addItem({
      title: post.meta.title,
      link: helpers.url(paths.post(post), true),
      date: new Date(post.meta.date.epochMilliseconds),
      description: post.meta.description,
    });
  }

  return feed;
}
