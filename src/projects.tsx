import { Octokit } from "npm:@octokit/core";
import { paginateRest } from "npm:@octokit/plugin-paginate-rest";

export const layout = "layouts/page.tsx";

export const type = "page";

export const title = "Projects";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({ auth: GITHUB_TOKEN });

function isGitHubProject(repo: { has_pages: boolean; topics: string[] }) {
  return repo.has_pages && repo.topics.includes("showcase-project");
}

async function* getGitHubProjects() {
  const responses = octokit.paginate.iterator(
    "GET /users/{username}/repos",
    {
      username: "Garciat",
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  for await (const response of responses) {
    for (const project of response.data) {
      if (isGitHubProject(project)) {
        yield {
          name: project.name,
          homepage: project.homepage || `https://garciat.com/${project.name}`,
          description: project.description,
          updated_at: new Date(project.updated_at),
        };
      }
    }
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

const projects = sortProjects(await consume(getGitHubProjects()));

export default (_data: Lume.Data, { date }: Lume.Helpers) => {
  return (
    <>
      <ul>
        {projects.map((project) => (
          <li>
            <p>
              <a href={project.homepage}>{project.name}</a>
            </p>
            <p>
              {project.description}
            </p>
            <p>
              Last update: {date(project.updated_at, "HUMAN_DATETIME")}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
};
