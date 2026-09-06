import { helpers } from "deno-static/mod.ts";

import { Page } from "../data.ts";
import { paths } from "../paths.ts";

import { GlobalFooter } from "./_components.tsx";
import { BaseLayout } from "./_layouts.tsx";
import { CustomizedMarkdown } from "./_markdown.tsx";

type PagePageProps = {
  page: Page;
};

export const PagePage: React.FC<PagePageProps> = ({ page }) => (
  <BaseLayout
    url={paths.page(page)}
    title={page.meta.title}
    description={page.meta.description}
  >
    <main className="page">
      <header>
        <div className="container">
          <p className="print-hide">
            <a href={helpers.url(paths.home())}>⇤ Back</a>
          </p>
          <h1>{page.meta.title}</h1>
        </div>
      </header>
      <div className="content post-contents">
        <CustomizedMarkdown>{page.body}</CustomizedMarkdown>
      </div>
      <GlobalFooter />
    </main>
  </BaseLayout>
);
