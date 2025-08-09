import {
  CommitGraphCommitNode,
  BranchPathType,
  CommitGraphCommit,
} from "../graph/CommitGraphTypes";

export const defaultStyle = {
  commitSpacing: 32,
  branchSpacing: 12,
  nodeRadius: 2,
  branchColors: [
    "#007acc", // cursor blue
    "#ff6b35", // orange
    "#4caf50", // green
    "#e91e63", // pink
    "#9c27b0", // violet
    "#00bcd4", // teal
    "#f44336", // red
    "#8bc34a", // lime
    "#673ab7", // grape
    "#03a9f4", // cyan
    "#3f51b5", // indigo
    "#ffeb3b", // yellow
  ],
};

export function formatCommits(
  commits: CommitGraphCommit[]
): CommitGraphCommitNode[] {
  const childrenMap: Map<string, Array<string>> = new Map();
  commits.forEach((commit) => {
    commit.parents.forEach((parent) => {
      if (childrenMap.get(parent.sha)) {
        childrenMap.get(parent.sha)?.push(commit.sha);
      } else {
        childrenMap.set(parent.sha, [commit.sha]);
      }
    });
  });
  return commits.map((commit) => {
    return {
      hash: commit.sha,
      parents: commit.parents.map((p) => p.sha),
      children: childrenMap.get(commit.sha) ?? [],
      committer: commit.commit.author.name,
      author_email: commit.commit.author.email,
      message: commit.commit.message,
      commitDate: new Date(commit.commit.author.date),
      commitColor: "",
      x: -1,
      y: -1,
      branches: commit.branches,
    };
  });
}

function hexToColorMatrixVariant(hex?: string): string {
  if (!hex) {
    return "";
  }
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  return `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0.5 0`;
}

function rgbColorToMatrixVariant(rgb: string): string {
  const [r, g, b] = rgb
    .toLowerCase()
    .replace("rgb(", "")
    .replace(")", "")
    .split(",")
    .map((x) => parseInt(x) / 255);
  return `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 0.5 0`;
}

export function convertColorToMatrixVariant(color: string): string {
  if (color.startsWith("#")) {
    return hexToColorMatrixVariant(color);
  }
  return rgbColorToMatrixVariant(color);
}

export function setCommitNodeColor(
  branch: BranchPathType,
  columnNumber: number,
  commitsMap: Map<string, CommitGraphCommitNode>,
  branchColor: string
) {
  commitsMap.forEach((commit) => {
    if (
      commit.x === columnNumber &&
      branch.start <= commit.y &&
      branch.end >= commit.y
    ) {
      commit.commitColor = branchColor;
    }
  });
}

export function setBranchAndCommitColor(
  columns: BranchPathType[][],
  branchColors: string[],
  commitsMap: Map<string, CommitGraphCommitNode>
) {
  columns.map((column, i) => {
    column.map((c) => {
      const branchColor = branchColors[c.branchOrder % branchColors.length];
      c.color = branchColor;
      setCommitNodeColor(c, i, commitsMap, branchColor);
    });
  });
}

export function fromCommitNodeToCommit(
  commit: CommitGraphCommitNode
): CommitGraphCommit {
  return {
    sha: commit.hash,
    commit: {
      author: {
        name: commit.committer,
        date: commit.commitDate,
        email: commit.author_email,
      },
      message: commit.message ?? "",
    },
    parents: commit.parents.map((p) => ({ sha: p })),
    branches: commit.branches,
  };
}
