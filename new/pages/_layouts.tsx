import { helpers } from "deno-static/mod.ts";

import { SiteConfig } from "../config.ts";
import { paths } from "../paths.ts";
import { GlobalFooter } from "./_components.tsx";

type PageLayoutProps = BaseLayoutProps;

export const PageLayout: React.FC<PageLayoutProps> = (
  { url, title, children },
) => (
  <BaseLayout url={url} title={title}>
    <main>
      <header>
        <div className="container">
          <h1>
            <a href={helpers.url(paths.home())}>{SiteConfig.title}</a>
          </h1>
        </div>
      </header>
      {children}
      <GlobalFooter />
    </main>
  </BaseLayout>
);

export type BaseLayoutProps = {
  url: `/${string}`;
  title: string;
  children: React.ReactNode;
};

export const BaseLayout: React.FC<BaseLayoutProps> = (
  { url, title, children },
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

      <meta name="description" content={SiteConfig.description} />
    </head>
    <body>
      {children}
    </body>
  </html>
);
