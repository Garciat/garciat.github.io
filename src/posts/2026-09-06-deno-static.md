---
title: "My own functional SSG for Deno"
date: 2026-09-06
description: "Looking back at 16 years of GitHub gists."
tags:
  - Deno
  - Web
---

This week, I built a static site generator (SSG) for [Deno](https://deno.com/).
I am now using it to build this website and [two](https://programming.report/)
[other](https://garciat.com/openjdk-jep-history/) side projects.

Although I have thoroughly enjoyed using [Lume](https://lume.land/) for
[almost two years](https://github.com/Garciat/garciat.github.io/commit/677efdc15ee46ee603b89ad754930b93b50c09a8)
now, I just couldn't avoid the itch to try to do it myself.

It started with an idea and an overarching principle.

The idea: model the sitemap as a recursive tree data structure and then render
it to disk.

```typescript
type Tree = {
  [segment: string]: Tree | Response;
};

const site = {
  "index.html": new Response("home page!"),
  "posts": {
    "first-post": { "index.html": new Response("this is a post") },
    "second-post": { "index.html": new Response("and another") },
  },
};

render(site);
// writes:
//   /index.html <-- "home page!"
//   /posts/first-post/index.html <-- "this is a post"
//   /posts/second-post/index.html <-- "and another"
```

The principle: follow a functional style by designing around functions and
values instead of conventions and behaviors.

I appreciate the ability to figure out what code is running by navigating down a
call tree. In contrast, many frameworks tend to do things behind the scenes
based on conventions (e.g. a file's location or name). This means that (a) I
need to learn a separate (maybe implicit) language, and (b) typing _may_ suffer
because of action-at-a-distance behaviors.

Anyway.

I uncreatively named the library
[deno-static](https://github.com/Garciat/deno-static).

Although it is not my intention for other people to use it, I did put some
effort into documenting it in case someone does try.
