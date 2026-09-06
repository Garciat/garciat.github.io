import { Post } from "../data.ts";

export const PostDetails = ({ post }: { post: Post }) => (
  <div className="post-details">
    <p>
      <time>
        {post.meta.date.toLocaleString("en", { dateStyle: "long" })}
      </time>
    </p>
    <p>
      {post.info.readingInfo.duration.total("minutes")} min read
    </p>
    <p>
      Tags: {post.meta.tags.join(", ")}
    </p>
  </div>
);

export const GlobalFooter = () => (
  <footer>
    <div className="container">
      <p>🙏</p>
    </div>
  </footer>
);
