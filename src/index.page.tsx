export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Home";

export const description = "The personal website of Gabriel Garcia.";

export default ({ search }: Lume.Data, { url, date }: Lume.Helpers) => {
  return (
    <>
      <div class="posts">
        {search.pages("type=post archived!=true", "date=desc").map((post) => (
          <div class="post">
            <h2 class="post-title">
              <a href={url(post.url)}>{post.title}</a>
            </h2>

            <span class="post-date">{date(post.date, "HUMAN_DATE")}</span>

            {post.description}
          </div>
        ))}
      </div>
    </>
  );
};
