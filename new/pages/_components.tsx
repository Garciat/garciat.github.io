import { helpers } from "deno-static/mod.ts";
import { SiteConfig } from "../config.ts";
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

export const SiteNavigation = ({ currentPath }: { currentPath: string }) => {
  return (
    <nav className="site-navigation">
      <ul>
        {SiteConfig.nav.map(([path, label]) => (
          <li className={path === currentPath ? "active" : ""}>
            <a href={helpers.url(path)}>
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
