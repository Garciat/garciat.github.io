export default function* ({ gists }: Lume.Data): Generator<Partial<Lume.Data>> {
  for (const gist of gists) {
    const indexFile = gist.files.find((file) => file.name === "index.html");

    if (!gist.files.some((file) => file.name.endsWith(".html"))) {
      continue;
    }

    const common = {
      type: "gist",
      url: `/gists/${gist.id}/`,
      title: gist.id,
      date: gist.created_at,
      gist: gist,
    };

    if (indexFile) {
      yield {
        ...common,
        content: indexFile.content,
      };
    } else {
      yield {
        ...common,
        layout: "layouts/gist.tsx",
      };
    }

    for (const file of gist.files) {
      if (file === indexFile) {
        continue;
      }
      yield {
        url: `/gists/${gist.id}/${file.name}`,
        content: file.content,
      };
    }
  }
}
