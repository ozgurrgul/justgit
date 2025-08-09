import { Badge, Box, Text, Group, Avatar, Tooltip } from "@mantine/core";
import { CommitGraphCommitNode } from "../CommitGraphTypes";
import { CommitGraphBranchButtons } from "./CommitGraphBranchButtons";
import { useHover } from "@mantine/hooks";
import { useCallback } from "react";
import {
  parseConventionalCommit,
  getConventionalCommitColor,
} from "../../helpers/conventionalCommits";
import { CommitContextMenu } from "../../CommitContextMenu";

interface Props {
  commit: CommitGraphCommitNode;
  isCurrentBranch: boolean;
  commitSpacing: number;
  onClick: () => void;
  y: number;
  currentBranch?: string;
}

export const CommitGraphMessageWrapper: React.FC<Props> = ({
  commit,
  isCurrentBranch,
  commitSpacing,
  y,
  onClick,
  currentBranch,
}) => {
  const { hovered, ref } = useHover();

  const getGravatarUrl = useCallback((email: string, size: number): string => {
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }, []);

  const getBackgroundColor = () => {
    // if (isCurrentBranch) {
    //   return "rgba(34, 139, 230, 0.1)";
    // }
    if (hovered) {
      return "rgba(34, 139, 230, 0.1)";
    }
    return "transparent";
  };

  const conventional = parseConventionalCommit(commit.message || "");

  return (
    <>
      <CommitContextMenu
        commit={commit}
        actions={[
          "checkout",
          "create-branch",
          "cherry-pick",
          "revert",
          "copy-hash",
          "copy-message",
          "view-details",
          "view-diff",
        ]}
      >
        <Box
          ref={ref}
          pos="absolute"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: "8px",
            transition: "all 0.2s ease",
          }}
          bg={getBackgroundColor()}
          p={"xs"}
          onClick={onClick}
          w="100%"
          h={commitSpacing - 2}
          flex={1}
          display="flex"
          top={`calc(${y}px - 1rem)`}
          // bd={isCurrentBranch ? "1px solid rgba(34, 139, 230, 0.3)" : "none"}
        >
          <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
            {commit.author_email && (
              <Tooltip
                label={`${commit.committer || "Unknown Author"} <${
                  commit.author_email
                }>`}
                position="top"
                withArrow
              >
                <Avatar
                  src={getGravatarUrl(commit.author_email, 20)}
                  alt={commit.committer || "Unknown"}
                  radius="xl"
                  size="xs"
                  style={{ flexShrink: 0 }}
                />
              </Tooltip>
            )}
            {conventional.isConventional && (
              <Badge
                size="xs"
                color={getConventionalCommitColor(conventional.type)}
                variant="filled"
                radius="sm"
                style={{ flexShrink: 0, textTransform: "revert" }}
              >
                {conventional.type}
                {conventional.scope && `(${conventional.scope})`}
              </Badge>
            )}
            <Text
              size="xs"
              fw={isCurrentBranch ? 600 : 500}
              lineClamp={1}
              style={{ flex: 1 }}
            >
              {conventional.isConventional
                ? conventional.description
                : commit.message}
            </Text>
          </Group>
          {commit.branches.length > 0 && (
            <CommitGraphBranchButtons
              branches={commit.branches}
              currentBranch={currentBranch}
            />
          )}
        </Box>
      </CommitContextMenu>
    </>
  );
};
