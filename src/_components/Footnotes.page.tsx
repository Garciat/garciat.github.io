export default function FootnotesPage(
  { footnotes }: Lume.Data,
  _helpers: Lume.Helpers,
) {
  return (
    <>
      {hasFootnotes(footnotes) && (
        <ol class="footnotes">
          {footnotes.map((note) => (
            <li class="footnote">
              <a id={note.id}></a>
              <span
                dangerouslySetInnerHTML={{
                  __html: cleanFootnoteContent(note.content),
                }}
              >
              </span>
              <a class="backref" href={`#${note.refId}`}>{"\u21A9\uFE0E"}</a>
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
