import { convertColorToMatrixVariant } from "../../helpers/utils";

type Props = {
  start: number;
  end: number;
  commitSpacing: number;
  branchSpacing: number;
  branchOrder: number;
  branchColor: string;
  nodeRadius: number;
  isCurrentBranch?: boolean;
};

export const BranchPath = ({
  start,
  end,
  commitSpacing,
  branchSpacing,
  branchColor,
  branchOrder,
  nodeRadius,
  isCurrentBranch,
}: Props) => {
  const height = Math.abs(end - start) * (commitSpacing + nodeRadius * 4);
  const x = nodeRadius * 4 + branchOrder * branchSpacing - 1;
  const matrixColor = convertColorToMatrixVariant(branchColor);
  const strokeWidth = isCurrentBranch ? "6" : "4";
  const shadowIntensity = isCurrentBranch ? "3.5" : "2.5";

  return (
    <>
      <g filter={`url(#filter${branchOrder}-${start}-${end})`}>
        <line
          x1={x}
          y1={start * commitSpacing + nodeRadius * 2}
          x2={x}
          y2={end * commitSpacing + nodeRadius * 5}
          stroke={branchColor}
          strokeWidth={strokeWidth}
          opacity={isCurrentBranch ? 1 : 0.8}
        />
      </g>
      <defs>
        <filter
          id={`filter${branchOrder}-${start}-${end}`}
          x={x}
          y={start * commitSpacing}
          width={12}
          height={height}
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
