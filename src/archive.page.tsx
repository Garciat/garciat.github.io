import { pickAll, setDateModified } from "./_includes/utils.ts";

export const type = "page";

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Posts Archive";

export const description =
  "A full archive of all the posts on this blog, organized by tags and date.";

export default (data: Lume.Data, h: Lume.Helpers) => {
  const { search, config, page } = data;

  const authorRef = `${h.url("/about/", true)}#Person`;

  const tags = search.values<string>("tags").toSorted();

  const posts = search.pages<Lume.Data>("type=post", "date=desc");

  setDateModified(page, pickAll("dateModified", posts));

  return (
    <>
      <nav class="container content">
        <p>
          {/* Go back */}
          <a href={h.url("/")}>&#8676; Back</a>
        </p>
      </nav>
      <main
        itemscope
        itemtype="http://schema.org/CollectionPage"
        class="container content"
      >
        <header>
          <h1 itemprop="name">{data.title}</h1>
          <p itemprop="description">{data.description}</p>
        </header>
        <aside
          itemprop="author"
          itemscope
          itemtype="http://schema.org/Person"
          itemid={authorRef}
        >
          <link itemprop="url" href={h.url("/about/", true)} />
          <meta itemprop="name" content={config.me.name} />
        </aside>
        <section>
          <h3 class="weak">Tags</h3>
          <ul class="pills">
            {tags.toSorted().map((tag) => {
              const tagPage = search.page(`type=tag tag="${tag}"`)!;
              return (
                <li
                  itemprop="hasPart"
                  itemscope
                  itemtype="http://schema.org/CollectionPage"
                >
                  <meta itemprop="name" content={tagPage.title} />
                  <a
                    itemprop="url"
                    href={h.url(tagPage.url)}
                  >
                    {tag}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
        <section
          itemprop="mainEntity"
          itemscope
          itemtype="http://schema.org/ItemList"
        >
          {postsByYear(posts).map(([year, posts]) => (
            <article>
              <h2>{year}</h2>
              <ul class="no-list-style">
                {postsByMonth(posts).map(([month, posts]) => (
                  <li>
                    <h3>{h.date(new Date(year, month), "MMMM")}</h3>
                    <ul>
                      {posts.map((post) => (
                        <li
                          itemprop="itemListElement"
                          itemscope
                          itemtype="http://schema.org/Article"
                        >
                          <link itemprop="author" href={authorRef} />
                          <meta
                            itemprop="datePublished"
                            content={post.date.toISOString()}
                          />
                          <a itemprop="url" href={h.url(post.url)}>
                            <span itemprop="headline">{post.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
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
