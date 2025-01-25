export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  { search, title, search_query }: Lume.Data,
  h: Lume.Helpers,
) => {
  const posts = search.pages<Lume.Data>(search_query, "date=desc");

  return (
    <>
      <p>
        <a href={h.url("/archive/")}>&#8676; Back</a>
      </p>
      <h2>{title}</h2>
      <ul>
        {posts.map((post) => (
          <li>
            <a href={h.url(post.url)}>{post.title}</a>{" "}
            <span class="weak">- {h.date(post.date, "HUMAN_DATE")}</span>
          </li>
        ))}
      </ul>
    </>
  );
};
