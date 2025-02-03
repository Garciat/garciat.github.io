export const layout: SiteLayout = "layouts/default.page.tsx";

export default (
  page: Lume.Data,
  h: Lume.Helpers,
) => {
  const { search, config } = page;

  const authorRef = `${h.url("/about/", true)}#Person`;

  const posts = search.pages<Lume.Data>(page.search_query, "date=desc");

  return (
    <main
      itemscope
      itemtype="http://schema.org/CollectionPage"
      class="container content"
    >
      <link itemprop="url" href={h.url(page.url, true)} />
      <meta itemprop="keywords" content={page.tag} />
      <header>
        <p>
          <a itemprop="isPartOf" href={h.url("../")}>&#8676; Back</a>
        </p>
        <h2 itemprop="name">{page.title}</h2>
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
        <ul
          itemprop="mainEntity"
          itemscope
          itemtype="http://schema.org/ItemList"
        >
          {posts.map((post) => (
            <li
              itemprop="itemListElement"
              itemscope
              itemtype="http://schema.org/BlogPosting"
            >
              <link itemprop="author" href={authorRef} />
              <a itemprop="url" href={h.url(post.url)}>
                <span itemprop="headline">{post.title}</span>
              </a>
              <span class="weak nowrap">
                {" - "}
                <time
                  itemprop="datePublished"
                  datetime={post.date.toISOString()}
                >
                  {h.date(post.date, "HUMAN_DATE")}
                </time>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};
