import { helpers } from "deno-static/mod.ts";

import Markdown from "npm:react-markdown@10";
import remarkGfm from "npm:remark-gfm@4.0.1";
import remarkToc, { Options as TocOptions } from "npm:remark-toc@9";
import rehypeSlug from "npm:rehype-slug@6";
import rehypeHighlight, {
  Options as HighlightOptions,
} from "npm:rehype-highlight@7";
import rehypeAutolinkHeadings, {
  Options as AutolinkOptions,
} from "npm:rehype-autolink-headings@7";

import { common } from "npm:lowlight@3.3.0";
import langHaskell from "npm:highlight.js@11.12.0/lib/languages/haskell";

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
    title={post.meta.title}
    description={post.meta.description}
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
          remarkPlugins={[
            remarkGfm,
            [
              remarkToc,
              { ordered: true, maxDepth: 3 } satisfies TocOptions,
            ],
          ]}
          rehypePlugins={[
            rehypeSlug,
            [
              rehypeHighlight,
              {
                languages: {
                  ...common,
                  haskell: langHaskell,
                },
              } satisfies HighlightOptions,
            ],
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                content: { type: "text", value: "#" },
              } satisfies AutolinkOptions,
            ],
          ]}
        >
          {post.body}
        </Markdown>
      </div>
      <GlobalFooter />
    </main>
  </BaseLayout>
);
