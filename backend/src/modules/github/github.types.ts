export interface GitHubRepoInfo {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  description?: string;
  language?: string;
  stars?: number;
  forks?: number;
  size?: number;
}

export interface CloneOptions {
  branch?: string;
  depth?: number;
  singleBranch?: boolean;
}

export interface CloneResult {
  localPath: string;
  commitSha: string;
  branch: string;
  clonedAt: Date;
}
