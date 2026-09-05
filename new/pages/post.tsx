import { helpers } from "deno-static/mod.ts";
import { syntaxHighlighting } from "deno-static/markdown.tsx";

import Markdown from "npm:react-markdown@10";
import remarkGfm from "npm:remark-gfm@4.0.1";
import rehypeSlug from "npm:rehype-slug@6";
import rehypeAutolinkHeadings, {
  Options as AutolinkOptions,
} from "npm:rehype-autolink-headings@7";

import { SiteConfig } from "../config.ts";
import { Post } from "../data.ts";
import { paths } from "../paths.ts";

import { GlobalFooter, PostDetails } from "./_components.tsx";
import { BaseLayout } from "./_layouts.tsx";

type PostPageProps = {
  post: Post;
};

export const PostPage: React.FC<PostPageProps> = ({ post }) => (
  <BaseLayout
    url={paths.post(post)}
    title={`${post.meta.title} - ${SiteConfig.title}`}
  >
    <main>
      <header>
        <div className="container">
          <p>
            <a href={helpers.url(paths.home())}>⇤ Back</a>
          </p>
        </div>
      </header>
      <div className="content post-contents">
        <h1>{post.meta.title}</h1>
        <PostDetails post={post} />
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                content: { type: "text", value: "#" },
              } satisfies AutolinkOptions,
            ],
          ]}
          components={{ ...syntaxHighlighting() }}
        >
          {post.body}
        </Markdown>
      </div>
      <GlobalFooter />
    </main>
  </BaseLayout>
);
