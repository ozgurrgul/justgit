import { CommitGraphCommitNode } from "../CommitGraphTypes";
import { CurvePath } from "./CurvePath";
import {
  CurveReturnType,
  getMergedFromBranchHeadPositions,
  getNewBranchToPath,
} from "./CurveUtils";

type Props = {
  commits: CommitGraphCommitNode[];
  commitsMap: Map<string, CommitGraphCommitNode>;
  commitSpacing: number;
  branchSpacing: number;
  nodeRadius: number;
};

type InnerProps = {
  newBranchCurves: CurveReturnType[];
  mergedCurves: CurveReturnType[];
  commit: CommitGraphCommitNode;
};

function Inner({ newBranchCurves, mergedCurves, commit }: InnerProps) {
  return (
    <>
      {newBranchCurves &&
        newBranchCurves.map((c) => {
          return (
            <CurvePath
              key={`${commit.hash}-curved-up-path-${c.id}`}
              curve={c}
            />
          );
        })}
      {mergedCurves &&
        mergedCurves.map((curve) => {
          return (
            <CurvePath
              key={`${commit.hash}-curved-down-path-${curve.id}`}
              curve={curve}
            />
          );
        })}
    </>
  );
}

export const CurvePaths = ({
  commits,
  commitsMap,
  commitSpacing,
  branchSpacing,
  nodeRadius,
}: Props) => {
  return (
    <>
      {commits.map((commit) => {
        const mergedCurves = getMergedFromBranchHeadPositions(
          commit,
          commitsMap,
          branchSpacing,
          commitSpacing,
          nodeRadius
        );

        const newBranchCurves = getNewBranchToPath(
          commit,
          commitsMap,
          branchSpacing,
          commitSpacing,
          nodeRadius
        );
        return (
          <Inner
            newBranchCurves={newBranchCurves}
            mergedCurves={mergedCurves}
            commit={commit}
            key={commit.hash}
          />
        );
      })}
    </>
  );
};
