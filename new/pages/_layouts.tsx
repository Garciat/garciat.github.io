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

      <title>{title}</title>

      <link rel="canonical" href={helpers.url(url, true)} />
      <link
        rel="alternate"
        href={helpers.url(paths.rss())}
        type="application/rss+xml"
        title={SiteConfig.title}
      />
      <link rel="stylesheet" href={helpers.url(paths.asset("/main.css"))} />

      {description && <meta name="description" content={description} />}
    </head>
    <body>
      {children}
    </body>
  </html>
);
