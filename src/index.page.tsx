export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Home";

export const description = "The personal website of Gabriel Garcia.";

export default ({ comp, search }: Lume.Data, { url, date }: Lume.Helpers) => {
  return (
    <>
      <div class="posts">
        {search.pages("type=post", "date=desc").map((post) => (
          <div class="post">
            <h2 class="post-title">
              <a href={url(post.url)}>{post.title}</a>
            </h2>

            <div class="post-meta">
              <div class="post-date">{date(post.date, "HUMAN_DATE")}</div>
              <comp.TagsList tags={post.tags} />
            </div>

            {post.description}
          </div>
        ))}
      </div>
    </>
  );
};
