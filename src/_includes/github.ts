import * as OctokitTypes from "npm:@octokit/types";
import * as OctokitOpenApiTypes from "npm:@octokit/openapi-types";
import { Octokit } from "npm:@octokit/core";
import { paginateRest } from "npm:@octokit/plugin-paginate-rest";

// Type definitions are not loading correctly from the Octokit plugin

export type GitHubGist = OctokitOpenApiTypes.components["schemas"]["base-gist"];

export type GitHubRepository =
  OctokitOpenApiTypes.components["schemas"]["minimal-repository"];

export type GitHubGistsResponse =
  OctokitOpenApiTypes.paths["/users/{username}/gists"]["get"]["responses"][
    "200"
  ]["content"]["application/json"];

export type GitHubRepositoriesResponse =
  OctokitOpenApiTypes.paths["/users/{username}/repos"]["get"]["responses"][
    "200"
  ]["content"]["application/json"];

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

const MyOctokit = Octokit.plugin(paginateRest);

const octokit = new MyOctokit({ auth: GITHUB_TOKEN });

export function getPaginatedUserGists(username: string): AsyncIterable<
  OctokitTypes.OctokitResponse<GitHubGistsResponse>
> {
  return octokit.paginate.iterator(
    "GET /users/{username}/gists",
    {
      username: username,
      per_page: 100,
    },
  );
}

export function getPaginatedUserRepos(username: string): AsyncIterable<
  OctokitTypes.OctokitResponse<GitHubRepositoriesResponse>
> {
  return octokit.paginate.iterator(
    "GET /users/{username}/repos",
    {
      username: username,
      per_page: 100,
    },
  );
}

export async function getRepositoryReadmeTitle(
  repository: GitHubRepository,
): Promise<string | null> {
  const response = await octokit.request("GET /repos/{owner}/{repo}/readme", {
    owner: repository.owner.login,
    repo: repository.name,
  });

  const content = response.data.content;
  if (content) {
    const decoded = atob(content);
    const match = decoded.match(/^# (.+)$/m);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function getRepositoryURL(
  username: string,
  repositoryName: string,
  branchName?: string,
): string {
  const base = `https://github.com/${username}/${repositoryName}`;
  if (branchName) {
    return `${base}/tree/${branchName}`;
  } else {
    return base;
  }
}

export function getConfigUserGistsURL(config: SiteConfig): string {
  return `https://gist.github.com/${config.github.username}`;
}

export function getConfigPagesURL(
  config: SiteConfig,
  repoName: string,
): string {
  return `${config.github.base_project_url}/${repoName}`;
}

export function getConfigRepositoryURL(config: SiteConfig): string {
  return getRepositoryURL(
    config.github.username,
    config.github.site.repo,
    config.github.site.branch,
  );
}

export function getConfigRepositoryPathURL(
  config: SiteConfig,
  path: string,
): string {
  return `${getConfigRepositoryURL(config)}/${config.sourceDir}${path}`;
}

export function getConfigWorkflowRunRequestURL(config: SiteConfig) {
  const request = octokit.request.endpoint(
    "GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
    {
      owner: config.github.username,
      repo: config.github.site.repo,
      workflow_id: config.github.site.buildWorkflow,
      status: "completed",
      branch: config.github.site.branch,
      per_page: 1,
    },
  );
  return request.url;
}

export function getWorkflowRunStartedAtQuery() {
  return "$.workflow_runs[0].run_started_at";
}
