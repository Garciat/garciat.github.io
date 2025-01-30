export const type = "page";

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Archive";

export const description =
  "Full archive of all the posts in this blog, organized by tags and date.";

export default ({ comp, search }: Lume.Data, h: Lume.Helpers) => {
  const tags = search.values<string>("tags").toSorted();

  const posts = search.pages<Lume.Data>("type=post", "date=desc");

  return (
    <>
      <header class="container content">
        <nav>
          <p>
            {/* Go back */}
            <a href={h.url("/")}>&#8676; Back</a>
          </p>
        </nav>
      </header>
      <main class="container content">
        <header>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <section>
          <h3 class="weak">Tags</h3>
          <comp.TagsList tags={tags} />
        </section>
        {postsByYear(posts).map(([year, posts]) => (
          <section>
            <h2>{year}</h2>
            <ul class="no-list-style">
              {postsByMonth(posts).map(([month, posts]) => (
                <li>
                  <h3>{h.date(new Date(year, month), "MMMM")}</h3>
                  <ul>
                    {posts.map((post) => (
                      <li>
                        <a href={h.url(post.url)}>{post.title}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
};

function postsByYear(posts: Lume.Data[]) {
  return groupBy(posts, (post) => post.date.getFullYear()).entries().toArray();
}

function postsByMonth(posts: Lume.Data[]) {
  return groupBy(posts, (post) => post.date.getMonth()).entries().toArray();
}

function groupBy<T, K>(list: T[], getKey: (item: T) => K) {
  const map = new Map<K, T[]>();
  list.forEach((item) => {
    const key = getKey(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}
