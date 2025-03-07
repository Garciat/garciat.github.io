export default function FootnotesPage(
  { footnotes }: Lume.Data,
  _helpers: Lume.Helpers,
) {
  const backrefSymbol = "\u21A9\uFE0E"; // ↩︎ (non-emoji version)
  return (
    <>
      {hasFootnotes(footnotes) && (
        <ol class="footnotes">
          {footnotes.map((note) => (
            <li class="footnote" title={note.label}>
              <a id={note.id}></a>
              <span
                dangerouslySetInnerHTML={{
                  __html: cleanFootnoteContent(note.content),
                }}
              >
              </span>
              <a class="backref" href={`#${note.refId}`}>{backrefSymbol}</a>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function hasFootnotes<T>(content: T[] | undefined): content is T[] {
  return (content?.length ?? 0) > 0;
}

function cleanFootnoteContent(content: string) {
  content = content.trim();
  if (content.startsWith("<p>")) {
    content = content.slice(3);
  }
  if (content.endsWith("</p>")) {
    content = content.slice(0, -4);
  }
  return content;
}
