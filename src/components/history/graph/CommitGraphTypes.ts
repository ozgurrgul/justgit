export type CommitGraphCommit = {
  sha: string;
  commit: {
    author: { name: string; date: string | number | Date; email?: string };
    message: string;
  };
  parents: { sha: string }[];
  branches: string[];
};

export type CommitGraphCommitNode = {
  hash: string;
  children: string[];
  parents: string[];
  committer: string;
  commitDate: Date;
  author?: string;
  author_email?: string;
  authorDate?: Date;
  message?: string;
  x: number;
  y: number;
  commitColor: string;
  branches: string[];
};

export type BranchPathType = {
  start: number;
  end: number;
  endCommitHash: string;
  endCommit?: CommitGraphCommitNode;
  color?: string;
  branchOrder: number;
};

export type GraphStyle = {
  commitSpacing: number;
  branchSpacing: number;
  branchColors: string[];
  nodeRadius: number;
};
