export default function TagsList({ search, tags }: Lume.Data, h: Lume.Helpers) {
  return (
    <>
      <ul class="post-tags">
        {tags.toSorted().map((tag) => (
          <li>
            <a
              href={h.url(
                search.page(`type=tag tag="${tag}"`)?.url ?? "/404.html",
              )}
            >
              {tag}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
