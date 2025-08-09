import { CommitGraphCommitNode } from "../CommitGraphTypes";

export function getCommitDotPosition(
  branchSpacing: number,
  commitSpacing: number,
  nodeRadius: number,
  commit: CommitGraphCommitNode
) {
  const x = branchSpacing * commit.x + nodeRadius * 4;
  const y = commitSpacing * commit.y + nodeRadius * 4;
  return { x, y };
}
