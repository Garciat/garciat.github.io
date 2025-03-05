import {
  getConfigPagesURL,
  getPaginatedUserRepos,
  getRepositoryReadmeTitle,
  GitHubRepository,
} from "./_includes/github.ts";
import {
  consume,
  pickAll,
  setDateModified,
  sortedByDate,
} from "./_includes/utils.ts";

export const type = "page";

export const top_nav = true;

export const layout: SiteLayout = "layouts/default.page.tsx";

export const title = "Projects";

export const description = "Projects I've worked on.";

interface Project {
  name: string;
  github_url: string;
  homepage: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
}

interface ProjectViewProps {
  project: Project;
  hideUpdated?: boolean;
}

export default async (data: Lume.Data, { date }: Lume.Helpers) => {
  const { comp, config, page } = data;

  const allProjects = await consume(getGitHubProjects(config));

  const [projects, projectsArchived] = [
    allProjects.filter((project) => !project.is_archived),
    allProjects.filter((project) => project.is_archived),
  ];

  setDateModified(page, pickAll("updated_at", allProjects));

  const ProjectView = (
    { project, hideUpdated = false }: ProjectViewProps,
  ) => (
    <article>
      <header>
        <h3>
          <a href={project.homepage}>{project.name}</a>
        </h3>
        <p>
        </p>
        <p class="weak small">
          <a
            href={project.github_url}
            title="View on GitHub"
          >
            View on GitHub
          </a>
          {" — "}
          <span>
            {"Created on "}
            <time datetime={project.created_at.toISOString()}>
              {date(project.created_at, "HUMAN_DATE")}
            </time>
          </span>
          {!hideUpdated && (
            <>
              {" — "}
              <span>
                {"Updated  "}
                <comp.RelativeTime time={project.updated_at} />
              </span>
            </>
          )}
        </p>
      </header>
      <p>
        {project.description}
      </p>
    </article>
  );

  return (
    <main class="container content">
      <section>
        <h1>{title}</h1>
        {sortedByDate("created_at", projects).map((project) => (
          <ProjectView project={project} />
        ))}
      </section>
      <hr />
      <section>
        <h2>Archived Projects</h2>
        {sortedByDate("created_at", projectsArchived).map((project) => (
          <ProjectView project={project} hideUpdated />
        ))}
      </section>
    </main>
  );
};

function isGitHubProject(repo: GitHubRepository): boolean {
  return repo.topics?.includes("showcase-project") ?? false;
}

async function* getGitHubProjects(config: SiteConfig): AsyncGenerator<Project> {
  for await (const response of getPaginatedUserRepos(config.github.username)) {
    for (const repo of response.data) {
      if (isGitHubProject(repo)) {
        const readmeTitle = await getRepositoryReadmeTitle(repo);

        yield {
          name: readmeTitle ?? repo.name,
          github_url: repo.html_url,
          homepage: repo.homepage || getConfigPagesURL(config, repo.name),
          description: repo.description ?? undefined,
          created_at: new Date(repo.created_at ?? 0),
          updated_at: new Date(repo.updated_at ?? repo.created_at ?? 0),
          is_archived: repo.topics?.includes("archived") ?? false,
        };
      }
    }
  }
}
