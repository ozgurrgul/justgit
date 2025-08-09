import { CommitGraphCommitNode } from "../CommitGraphTypes";
import { convertColorToMatrixVariant } from "../../helpers/utils";
import { getCommitDotPosition } from "./CommitDotUtils";

type Props = {
  commit: CommitGraphCommitNode;
  commitSpacing: number;
  branchSpacing: number;
  nodeRadius: number;
  isCurrentBranch?: boolean;
};

export const CommitDot = ({
  commit,
  commitSpacing,
  branchSpacing,
  nodeRadius,
  isCurrentBranch,
}: Props) => {
  const { x, y } = getCommitDotPosition(
    branchSpacing,
    commitSpacing,
    nodeRadius,
    commit
  );
  const matrixColor = convertColorToMatrixVariant(commit.commitColor);
  const dotRadius = isCurrentBranch ? nodeRadius * 2.5 : nodeRadius * 2;
  const shadowIntensity = isCurrentBranch ? "3.5" : "2.5";

  return (
    <>
      <g filter={`url(#filter${commit.hash.slice(0, 7)})`}>
        <circle
          cx={x}
          cy={y}
          r={dotRadius}
          fill={commit.commitColor}
          stroke={isCurrentBranch ? "#ffffff" : "none"}
          strokeWidth={isCurrentBranch ? "2" : "0"}
          opacity={isCurrentBranch ? 1 : 0.9}
        />
      </g>
      <defs>
        <filter
          id={`filter${commit.hash.slice(0, 7)}`}
          x={x - 10}
          y={y - 10}
          width={20}
          height={20}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation={shadowIntensity} />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values={matrixColor} />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_2_590"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_2_590"
            result="shape"
          />
        </filter>
      </defs>
    </>
  );
};
