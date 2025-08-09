import {
  CommitGraphCommit,
  CommitGraphCommitNode,
  GraphStyle,
} from "../CommitGraphTypes";
import {
  defaultStyle,
  formatCommits,
  setBranchAndCommitColor,
} from "../../helpers/utils";
import { BranchPaths } from "../Branches/BranchPaths";
import { CommitDot } from "../CommitDot/CommitDot";
import { CurvePaths } from "../Curves/CurvePaths";
import { computePosition } from "./CommitGraphUtils";
import { Box, ScrollArea } from "@mantine/core";
import { getCommitDotPosition } from "../CommitDot/CommitDotUtils";
import { CommitGraphMessageWrapper } from "./CommitGraphMessageWrapper";

export type CommitGraphProps = {
  commits: CommitGraphCommit[];
  graphStyle?: GraphStyle;
  currentBranch?: string;
  onCommitClick?: (commit: CommitGraphCommitNode) => void;
};

export const CommitGraph: React.FC<CommitGraphProps> = ({
  commits,
  graphStyle,
  currentBranch,
  onCommitClick,
}) => {
  const commitNodes = formatCommits(commits);
  const { commitSpacing, branchSpacing, branchColors, nodeRadius } = {
    ...defaultStyle,
    ...graphStyle,
  };
  const { columns, commitsMap } = computePosition(commitNodes);
  const width = columns.length * (branchSpacing + nodeRadius * 2) + 3;
  // the position of the last commit is Math.max(...Array.from(commitsMap.values()).map((c) => c.x)), and 64 is the height of the commit details.
  const height = commitsMap.size
    ? Math.max(...Array.from(commitsMap.values()).map((c) => c.y)) *
        commitSpacing +
      nodeRadius * 8 +
      64
    : 0;
  setBranchAndCommitColor(columns, branchColors, commitsMap);
  const commitsNodes = Array.from(commitsMap.values());
  const paddingRight = 8;
  const commitInfoLeftPosition = 120 + paddingRight;

  return (
    <Box pos="relative" style={{ display: "flex", flexDirection: "column" }}>
      <ScrollArea
        style={{
          width: 100,
        }}
        scrollbarSize={0}
        offsetScrollbars={false}
      >
        <svg width={width} height={height}>
          <BranchPaths
            columns={columns}
            commitsMap={commitsMap}
            commitSpacing={commitSpacing}
            branchSpacing={branchSpacing}
            nodeRadius={nodeRadius}
            branchColors={branchColors}
            currentBranch={currentBranch}
          />
          <CurvePaths
            commitsMap={commitsMap}
            commits={commitsNodes}
            commitSpacing={commitSpacing}
            branchSpacing={branchSpacing}
            nodeRadius={nodeRadius}
          />
          {commitsNodes.map((commit) => {
            return (
              <CommitDot
                key={`${commit.hash}-dot`}
                commit={commit}
                commitSpacing={commitSpacing}
                branchSpacing={branchSpacing}
                nodeRadius={nodeRadius}
                isCurrentBranch={
                  currentBranch
                    ? commit.branches.includes(currentBranch)
                    : false
                }
              />
            );
          })}
        </svg>
      </ScrollArea>
      <Box
        pos="absolute"
        style={{
          left: commitInfoLeftPosition - paddingRight,
          width: `calc(100% - ${commitInfoLeftPosition}px)`,
          paddingRight,
        }}
      >
        {commitsNodes.map((commit) => {
          const { y } = getCommitDotPosition(
            branchSpacing,
            commitSpacing,
            nodeRadius,
            commit
          );
          const isCurrentBranch = currentBranch
            ? commit.branches.includes(currentBranch)
            : false;

          return (
            <CommitGraphMessageWrapper
              key={commit.hash}
              commit={commit}
              isCurrentBranch={isCurrentBranch}
              commitSpacing={commitSpacing}
              onClick={() => onCommitClick?.(commit)}
              y={y}
              currentBranch={currentBranch}
            />
          );
        })}
      </Box>
    </Box>
  );
};
