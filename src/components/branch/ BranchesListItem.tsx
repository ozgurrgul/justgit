import React from "react";
import { Group, Text, Paper } from "@mantine/core";
import { BranchContextMenu, BranchAction } from "./BranchContextMenu";
import { useHover } from "@mantine/hooks";

interface Props {
  branch: string;
  isActiveBranch: boolean;
  actions: BranchAction[];
}

export const BranchesListItem: React.FC<Props> = ({
  branch,
  isActiveBranch,
  actions,
}) => {
  const { ref, hovered } = useHover();
  return (
    <BranchContextMenu
      branch={branch}
      isActiveBranch={isActiveBranch}
      actions={actions}
    >
      <Paper
        ref={ref}
        style={{
          cursor: "pointer",
          backgroundColor: isActiveBranch
            ? "var(--mantine-color-blue-light)"
            : hovered
            ? "var(--mantine-color-dark-5)"
            : undefined,
          transition: "all 0.2s ease",
        }}
        py="4px"
        px="8px"
      >
        <Group gap="xs" style={{ width: "100%" }}>
          <i
            className={`fa-xs fas ${
              isActiveBranch ? "fa-check" : "fa-code-branch"
            }`}
            style={{ flexShrink: 0 }}
          ></i>
          <Text size="xs" fw={isActiveBranch ? 500 : 400} truncate style={{ flex: 1, minWidth: 0 }}>
            {branch}
          </Text>
        </Group>
      </Paper>
    </BranchContextMenu>
  );
};
