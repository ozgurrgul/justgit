import React, { useEffect, useCallback } from "react";
import {
  Stack,
  Group,
  Text,
  Badge,
  Avatar,
  Card,
  ScrollArea,
  Tooltip,
  Box,
} from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectActiveCommitHash,
  selectActiveRepoPath,
  selectActiveRepo,
  selectCommitDiff,
  selectCommitSignature,
} from "@/store/selectors";
import {
  getCommitDiff,
  getDiff,
  setActiveDiff,
  setMainUiMode,
  setSidebarUiMode,
  getCommitSignature,
} from "@/store/appSlice";
import { ChangesList } from "../changes/ChangesList";
import { useElementSize } from "@mantine/hooks";
import { HeaderWithCloseButton } from "../HeaderWithCloseButton";

export const CommitDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeCommitHash = useAppSelector(selectActiveCommitHash);
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const activeRepo = useAppSelector(selectActiveRepo);
  const commitDiff = useAppSelector(selectCommitDiff);
  const signatureData = useAppSelector((state) =>
    selectCommitSignature(state, activeCommitHash || "")
  );

  const { ref: containerRef, height: availableHeight } = useElementSize();
  const { ref: commitDetailsSectionRef, height: commitDetailsSectionHeight } =
    useElementSize();
  const changesListHeight = availableHeight - commitDetailsSectionHeight - 140;

  // Find the commit details from the log
  const commitDetails = activeRepo?.log?.all?.find(
    (commit) => commit.hash === activeCommitHash
  );

  const getGravatarUrl = useCallback((email: string, size: number): string => {
    const hash = email.toLowerCase().trim();
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString();
  }, []);

  const getSignatureInfo = useCallback((status: string | null | undefined) => {
    if (!status) return null;

    switch (status) {
      case "G":
        return {
          icon: "fas fa-shield-alt",
          color: "#28a745",
          tooltip: "Good signature",
        };
      case "B":
        return {
          icon: "fas fa-shield-alt",
          color: "#dc3545",
          tooltip: "Bad signature",
        };
      case "U":
        return {
          icon: "fas fa-shield-alt",
          color: "#ffc107",
          tooltip: "Unknown signature validity",
        };
      case "X":
        return {
          icon: "fas fa-shield-alt",
          color: "#fd7e14",
          tooltip: "Expired signature",
        };
      case "Y":
        return {
          icon: "fas fa-shield-alt",
          color: "#fd7e14",
          tooltip: "Expired signing key",
        };
      case "R":
        return {
          icon: "fas fa-shield-alt",
          color: "#dc3545",
          tooltip: "Revoked signing key",
        };
      case "E":
        return {
          icon: "fas fa-exclamation-triangle",
          color: "#dc3545",
          tooltip: "Cannot check signature",
        };
      case "N":
      default:
        return null;
    }
  }, []);

  const handleBackToHistory = useCallback(() => {
    dispatch(setMainUiMode("commit-history"));
    dispatch(setSidebarUiMode("commit-history"));
  }, [dispatch]);

  const handleFileClick = useCallback(
    (filePath: string) => {
      if (activeRepoPath && activeCommitHash) {
        dispatch(setActiveDiff({ filePath, mode: "view" }));
        dispatch(
          getDiff({
            repoPath: activeRepoPath,
            filePath,
            commitHash: activeCommitHash,
          })
        );
        dispatch(setMainUiMode("diff-viewer"));
      }
    },
    [dispatch, activeRepoPath, activeCommitHash]
  );

  // Load commit diff when component mounts or commit hash changes
  useEffect(() => {
    if (activeRepoPath && activeCommitHash) {
      dispatch(
        getCommitDiff({
          repoPath: activeRepoPath,
          commitHash: activeCommitHash,
        })
      );
    }
  }, [dispatch, activeRepoPath, activeCommitHash]);

  // Load signature info when commit details are viewed
  useEffect(() => {
    if (activeRepoPath && activeCommitHash && !signatureData) {
      dispatch(
        getCommitSignature({
          repoPath: activeRepoPath,
          commitHash: activeCommitHash,
        })
      );
    }
  }, [dispatch, activeRepoPath, activeCommitHash, signatureData]);

  if (!commitDetails) {
    return (
      <Stack p="md">
        <Text c="dimmed">No commit details available</Text>
      </Stack>
    );
  }

  const signatureInfo = getSignatureInfo(signatureData?.status);

  return (
    <Stack p="md" h="100%" ref={containerRef}>
      {/* Header with back button */}
      <Stack>
        <HeaderWithCloseButton
          title="Commit Details"
          onClose={handleBackToHistory}
        />

        {/* Commit Information */}
        <Card withBorder mb="md" ref={commitDetailsSectionRef}>
          <Stack gap="xs">
            <Group gap="xs">
              <Avatar
                src={getGravatarUrl(commitDetails.author_email, 32)}
                alt={commitDetails.author_name || "Unknown"}
                radius="xl"
                size="sm"
              />
              <Stack gap="2px" style={{ flex: 1 }}>
                <Text size="sm" fw={500}>
                  {commitDetails.author_name || "Unknown Author"}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatDate(commitDetails.date)}
                </Text>
              </Stack>
              {signatureInfo && (
                <Tooltip
                  label={`${signatureInfo.tooltip}${
                    signatureData?.signer ? ` by ${signatureData.signer}` : ""
                  }`}
                  position="top"
                  withArrow
                >
                  <Box>
                    <i
                      className={signatureInfo.icon}
                      style={{
                        color: signatureInfo.color,
                        fontSize: "16px",
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
            </Group>

            <Text size="xs" fw={500}>
              {commitDetails.message || "No commit message"}
            </Text>

            <Group gap="xs">
              <Badge variant="light" color="gray" size="sm">
                {commitDetails.hash.substring(0, 8)}
              </Badge>
              {commitDetails.parents && commitDetails.parents.length > 0 && (
                <Group gap="xs">
                  <Text size="xs" c="dimmed">
                    Parent:
                  </Text>
                  {commitDetails.parents.map((parent, index) => (
                    <Badge key={index} variant="outline" color="gray" size="xs">
                      {parent.substring(0, 8)}
                    </Badge>
                  ))}
                </Group>
              )}
            </Group>
          </Stack>
        </Card>
      </Stack>
      {/* File Changes */}
      <Stack style={{ flex: 1 }}>
        <Text size="sm" fw={500}>
          Changed Files{" "}
          {commitDiff.files.length > 0 && `(${commitDiff.files.length})`}
        </Text>
        <ScrollArea h={changesListHeight}>
          {commitDiff.files.length > 0 ? (
            <ChangesList
              fileChanges={commitDiff.files}
              type="staged"
              onClickFile={handleFileClick}
            />
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="lg">
              {commitDiff.commitHash === activeCommitHash
                ? "No files changed"
                : "Loading file changes..."}
            </Text>
          )}
        </ScrollArea>
      </Stack>
    </Stack>
  );
};
