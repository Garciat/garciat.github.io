import { helpers } from "deno-static/mod.ts";

import Markdown from "npm:react-markdown@10";

import { SiteConfig } from "../config.ts";
import { Post } from "../data.ts";
import { paths } from "../paths.ts";

import { PostDetails } from "./_components.tsx";
import { PageLayout } from "./_layouts.tsx";

type IndexPageProps = {
  posts: Post[];
};

export const IndexPage: React.FC<IndexPageProps> = ({ posts }) => (
  <PageLayout url={paths.home()} title={SiteConfig.title}>
    <div className="content">
      <div className="post-index">
        {posts.toSorted(
          (a, b) =>
            Temporal.Instant.compare(b.meta.date, a.meta.date),
        ).map((post) => (
          <article key={post.path}>
            <h3>
              <a href={helpers.url(paths.post(post))}>{post.meta.title}</a>
            </h3>
            <PostDetails post={post} />
            {post.meta.description && (
              <div className="post-excerpt">
                <Markdown>{post.meta.description}</Markdown>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  </PageLayout>
);
