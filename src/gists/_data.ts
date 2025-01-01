import { Octokit } from "npm:@octokit/core";
import { paginateRest } from "npm:@octokit/plugin-paginate-rest";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({ auth: GITHUB_TOKEN });

function isDisplayableGist(
  gist: { files: Record<string, { filename: string }> },
) {
  return Object.values(gist.files).some((file) =>
    file.filename.endsWith(".html")
  );
}

async function* getGists(): AsyncGenerator<Gist> {
  const responses = octokit.paginate.iterator(
    "GET /users/{username}/gists",
    {
      username: "Garciat",
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  for await (const response of responses) {
    for (const gist of response.data) {
      if (isDisplayableGist(gist)) {
        yield {
          id: gist.id,
          github_url: gist.html_url,
          description: gist.description,
          files: await consume(loadGistFiles(gist)),
          created_at: new Date(gist.created_at),
          updated_at: new Date(gist.updated_at),
        };
      }
    }
  }
}

async function* loadGistFiles(gist: any): AsyncGenerator<GistFile> {
  for (const file of Object.values<any>(gist.files)) {
    yield {
      name: file.filename,
      language: file.language,
      content: await fetch(file.raw_url).then((res) => res.text()),
    };
  }
}

function sortProjects<T extends { updated_at: Date }>(projects: T[]): T[] {
  return projects.toSorted((a, b) =>
    b.updated_at.getTime() - a.updated_at.getTime()
  );
}

async function consume<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const items = [];
  for await (const item of iterable) {
    items.push(item);
  }
  return items;
}

export const gists = sortProjects(await consume(getGists()));

declare global {
  interface Gist {
    id: string;
    github_url: string;
    description: string;
    files: GistFile[];
    created_at: Date;
    updated_at: Date;
  }

  interface GistFile {
    name: string;
    language: string;
    content: string;
  }

  namespace Lume {
    interface Data {
      gists: Gist[];
    }
  }
}
