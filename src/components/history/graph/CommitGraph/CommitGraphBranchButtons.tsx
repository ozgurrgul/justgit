import { Badge, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import {
  BranchContextMenu,
  BranchAction,
} from "../../../branch/BranchContextMenu";

// Constants
const PRIORITY_WEIGHTS = {
  CURRENT: 200,
  MAIN: 100,
  LOCAL_AND_REMOTE: 75,
  LOCAL_ONLY: 50,
  REMOTE_ONLY: 25,
} as const;

const MAIN_BRANCH_PATTERNS = ["main", "master"];
const DEFAULT_MAX_VISIBLE = 30;

// Types
interface Props {
  branches: string[];
  maxVisible?: number;
  currentBranch?: string;
}

interface ProcessedBranch {
  name: string;
  displayName: string;
  hasLocal: boolean;
  hasRemote: boolean;
  isMain: boolean;
  isCurrent: boolean;
  priority: number;
  localBranchName?: string;
  remoteBranchName?: string;
}

// Helper functions
const isMainBranch = (branchName: string): boolean =>
  MAIN_BRANCH_PATTERNS.some((pattern) => branchName.includes(pattern));

const isRemoteBranch = (branchName: string): boolean =>
  branchName.includes("origin/");

const extractDisplayName = (branchName: string): string =>
  isRemoteBranch(branchName)
    ? branchName.split("/").pop() || branchName
    : branchName;

const calculatePriority = (branch: ProcessedBranch): number => {
  let priority = 0;

  if (branch.isCurrent) priority += PRIORITY_WEIGHTS.CURRENT;
  if (branch.isMain) priority += PRIORITY_WEIGHTS.MAIN;
  if (branch.hasLocal && branch.hasRemote)
    priority += PRIORITY_WEIGHTS.LOCAL_AND_REMOTE;
  else if (branch.hasLocal) priority += PRIORITY_WEIGHTS.LOCAL_ONLY;
  else if (branch.hasRemote) priority += PRIORITY_WEIGHTS.REMOTE_ONLY;

  return priority;
};

const processBranches = (
  branches: string[],
  currentBranch?: string
): ProcessedBranch[] => {
  const branchMap = new Map<string, ProcessedBranch>();

  branches.forEach((branch) => {
    const isRemote = isRemoteBranch(branch);
    const displayName = extractDisplayName(branch);
    const isMain = isMainBranch(displayName);
    const isCurrent = branch === currentBranch;

    if (!branchMap.has(displayName)) {
      branchMap.set(displayName, {
        name: displayName,
        displayName,
        hasLocal: false,
        hasRemote: false,
        isMain,
        isCurrent: false,
        priority: 0,
        localBranchName: undefined,
        remoteBranchName: undefined,
      });
    }

    const existing = branchMap.get(displayName)!;

    if (isRemote) {
      existing.hasRemote = true;
      existing.remoteBranchName = branch;
    } else {
      existing.hasLocal = true;
      existing.localBranchName = branch;
      // Only local branches can be current
      if (isCurrent) {
        existing.isCurrent = true;
      }
    }

    existing.priority = calculatePriority(existing);
  });

  return Array.from(branchMap.values()).sort((a, b) => b.priority - a.priority);
};

const getBranchColor = (branch: ProcessedBranch): string =>
  branch.isCurrent ? "orange" : "gray";

const getBranchActions = (branch: ProcessedBranch): BranchAction[] => {
  const actions: BranchAction[] = ["create"];

  if (!branch.isCurrent) {
    actions.push("switch");
    if (branch.hasLocal) {
      actions.push("merge");
    }
  }

  actions.push("pull");
  actions.push("push");

  if (branch.hasLocal && !branch.isCurrent) {
    actions.push("rename");
    if (!branch.isMain) {
      actions.push("delete");
    }
  }

  return actions;
};

const getTooltipText = (branch: ProcessedBranch): string => {
  const parts = [];

  if (branch.isCurrent) parts.push("Current");

  if (branch.hasLocal && branch.hasRemote) parts.push("Local + Remote");
  else if (branch.hasLocal) parts.push("Local");
  else parts.push("Remote");

  return `${parts.join(", ")}: ${branch.displayName}`;
};

const getBranchNameForActions = (branch: ProcessedBranch): string =>
  branch.localBranchName || branch.remoteBranchName || branch.displayName;

// Styles
const containerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  marginLeft: "8px",
} as const;

const getBadgeStyle = (branch: ProcessedBranch) => ({
  fontWeight: branch.isCurrent ? 700 : branch.isMain ? 600 : 500,
  maxWidth: "120px",
  whiteSpace: "nowrap" as const,
  overflow: "hidden" as const,
  textOverflow: "ellipsis" as const,
  display: "flex",
  alignItems: "center",
  border: getBranchColor(branch),
  textTransform: "revert" as const,
  cursor: "pointer",
});

const iconStyle = {
  opacity: 0.8,
  marginRight: "4px",
} as const;

const currentBranchIconStyle = {
  opacity: 0.9,
  marginRight: "4px",
} as const;

const hiddenBadgeStyle = {
  fontSize: "8px",
  fontWeight: 400,
  cursor: "pointer",
} as const;

const tooltipStyle = {
  maxWidth: "300px",
} as const;

// Components
const BranchIcon: React.FC<{ branch: ProcessedBranch }> = ({ branch }) => (
  <>
    {branch.isCurrent && (
      <i className="fa fa-check-circle" style={currentBranchIconStyle} />
    )}
    {branch.hasLocal && <i className="fa fa-tv" style={iconStyle} />}
    {branch.hasRemote && <i className="fa fa-cloud" style={iconStyle} />}
  </>
);

const BranchBadge: React.FC<{ branch: ProcessedBranch }> = ({ branch }) => (
  <BranchContextMenu
    branch={getBranchNameForActions(branch)}
    isActiveBranch={branch.isCurrent}
    actions={getBranchActions(branch)}
  >
    <Tooltip label={getTooltipText(branch)} position="top" withArrow>
      <Badge
        variant="filled"
        color={getBranchColor(branch)}
        size="xs"
        style={getBadgeStyle(branch)}
      >
        <BranchIcon branch={branch} />
        {branch.displayName}
      </Badge>
    </Tooltip>
  </BranchContextMenu>
);

const HiddenBranchesIndicator: React.FC<{
  count: number;
  allBranches: string;
}> = ({ count, allBranches }) => (
  <Tooltip
    label={`All branches: ${allBranches}`}
    position="top"
    withArrow
    multiline
    style={tooltipStyle}
  >
    <Badge variant="outline" color="gray" size="xs" style={hiddenBadgeStyle}>
      +{count} more
    </Badge>
  </Tooltip>
);

// Main component
export const CommitGraphBranchButtons: React.FC<Props> = ({
  branches,
  maxVisible = DEFAULT_MAX_VISIBLE,
  currentBranch,
}) => {
  const processedBranches = useMemo(
    () => processBranches(branches, currentBranch),
    [branches, currentBranch]
  );

  const visibleBranches = processedBranches.slice(0, maxVisible);
  const hiddenCount = Math.max(0, processedBranches.length - maxVisible);
  const allBranchesText = branches.join(", ");

  return (
    <div style={containerStyle}>
      {visibleBranches.map((branch, index) => (
        <BranchBadge key={`${branch.displayName}-${index}`} branch={branch} />
      ))}

      {hiddenCount > 0 && (
        <HiddenBranchesIndicator
          count={hiddenCount}
          allBranches={allBranchesText}
        />
      )}
    </div>
  );
};
