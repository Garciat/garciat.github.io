import { helpers } from "deno-static/mod.ts";

import { Post } from "../data.ts";
import { paths } from "../paths.ts";

import { GlobalFooter, PostDetails } from "./_components.tsx";
import { BaseLayout } from "./_layouts.tsx";
import { CustomizedMarkdown } from "./_markdown.tsx";

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
        <div className="container print-hide">
          <p>
            <a href={helpers.url(paths.home())}>⇤ Back</a>
          </p>
        </div>
      </header>
      <div className="content post-contents">
        <h1>{post.meta.title}</h1>
        <PostDetails post={post} />
        <CustomizedMarkdown>{post.body}</CustomizedMarkdown>
      </div>
      <GlobalFooter />
    </main>
  </BaseLayout>
);
