export default function* (
  { config, gists, title }: Lume.Data,
): Generator<GistPageData | GistFileData> {
  for (const gist of gists) {
    const indexFile = gist.files.find((file) => file.name === "index.html");

    if (!gist.files.some((file) => file.name.endsWith(".html"))) {
      continue;
    }

    const common = {
      type: "gist" as const,
      url: `/gists/${gist.id}/`,
      title: `${gist.title}${config.titleSeparator}${title}`,
      created_at: gist.created_at,
      updated_at: gist.updated_at,
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
        type: "gist-file",
        url: `/gists/${gist.id}/${file.name}`,
        content: file.content,
      };
    }
  }
}

declare global {
  interface GistPageData {
    type: "gist";
    url: string;
    created_at: Date;
    updated_at: Date;
    gist: Gist;
    layout?: string;
    title?: string;
    content?: string;
  }

  interface GistFileData {
    type: "gist-file";
    url: string;
    content?: string;
  }
}
