import { helpers } from "deno-static/mod.ts";

import { SiteConfig } from "../config.ts";
import { paths } from "../paths.ts";

export type BaseLayoutProps = {
  url: `/${string}`;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const BaseLayout: React.FC<BaseLayoutProps> = (
  { url, title, description, children },
) => (
  <html lang={SiteConfig.language}>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <meta name="referrer" content="same-origin" />

      <title>{title}</title>

      <link rel="canonical" href={helpers.url(url, true)} />

      {description && <meta name="description" content={description} />}

      <link
        rel="alternate"
        href={helpers.url(paths.rssFeed())}
        type="application/rss+xml"
        title={SiteConfig.title}
      />
      <link
        rel="alternate"
        href={helpers.url(paths.jsonFeed())}
        type="application/json"
        title={SiteConfig.title}
      />

      <link rel="stylesheet" href={helpers.url(paths.asset("/main.css"))} />

      <link
        rel="stylesheet"
        href="https://unpkg.com/@highlightjs/cdn-assets@11.12.0/styles/github.min.css"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/@highlightjs/cdn-assets@11.12.0/styles/github-dark.min.css"
        media="(prefers-color-scheme: dark)"
      />
    </head>
    <body>
      {children}
    </body>
  </html>
);
