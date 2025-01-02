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
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
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
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
}
