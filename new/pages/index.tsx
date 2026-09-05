import { helpers } from "deno-static/mod.ts";

import { SiteConfig } from "../config.ts";
import { Post } from "../data.ts";
import { paths } from "../paths.ts";

import { GlobalFooter } from "./_components.tsx";
import { BaseLayout } from "./_layouts.tsx";

type IndexPageProps = {
  posts: Post[];
};

export const IndexPage: React.FC<IndexPageProps> = ({ posts }) => (
  <BaseLayout
    url={paths.home()}
    title={SiteConfig.title}
    description={SiteConfig.description}
  >
    <main>
      <header>
        <div className="container">
          <h1>{SiteConfig.title}</h1>
        </div>
      </header>
      <div className="content">
        <p>
          Hello. I enjoy writing <a href="https://github.com/garciat">code</a>
          {" "}
          and <a href="#posts">about code</a>.
        </p>
        <h2 id="posts">Posts</h2>
        <ul className="post-index">
          {posts.toSorted(
            (a, b) => Temporal.Instant.compare(b.meta.date, a.meta.date),
          ).map((post) => (
            <li>
              <time className="text-weak">
                {post.meta.date.toLocaleString("en", { dateStyle: "medium" })}
              </time>
              <span>
                <a href={helpers.url(paths.post(post))}>{post.meta.title}</a>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <GlobalFooter />
    </main>
  </BaseLayout>
);
