import {
  Stack,
  Text,
  Paper,
  Accordion,
  ActionIcon,
  Tooltip,
  Group,
} from "@mantine/core";
import { StagedChangesList } from "./StagedChangesList";
import { UnstagedChangesList } from "./UnstagedChangesList";
import {
  selectActiveRepo,
  selectActiveRepoPath,
  selectChangesSidebarAccordionValues,
  selectStagedFiles,
  selectStaging,
  selectUnstagedFiles,
  selectUnstaging,
  setChangesSidebarAccordionState,
  stageFiles,
  unstageFiles,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import { useCallback } from "react";
import { useElementSize } from "@mantine/hooks";
import { ChangesCommitArea } from "./ChangesCommitArea";

export const ChangesSidebar = () => {
  const dispatch = useAppDispatch();
  const activeRepo = useAppSelector(selectActiveRepo);
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const unstagedFiles = useAppSelector(selectUnstagedFiles);
  const stagedFiles = useAppSelector(selectStagedFiles);
  const staging = useAppSelector(selectStaging);
  const unstaging = useAppSelector(selectUnstaging);

  const accordionValues = useAppSelector(selectChangesSidebarAccordionValues);

  const { ref: containerRef, height: availableHeight } = useElementSize();
  const { ref: commitSectionRef, height: commitSectionHeight } =
    useElementSize();

  // Calculate remaining height for accordion
  const remainingHeight = availableHeight - commitSectionHeight;
  const accordionHeight = Math.max(0, remainingHeight - 20); // 20px for padding/margins
  const openAccordionCount = accordionValues.length;
  const accordionItemHeight = Math.max(
    0,
    openAccordionCount === 1 ? accordionHeight - 90 : accordionHeight / 2
  );

  const handleChangesSidebarAccordionChange = useCallback(
    (value: string[]) => {
      dispatch(setChangesSidebarAccordionState(value));
    },
    [dispatch]
  );

  const handleStageAllFiles = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeRepoPath && unstagedFiles.length > 0) {
        const filePaths = unstagedFiles.map((file) => file.path);
        dispatch(stageFiles({ repoPath: activeRepoPath, files: filePaths }));
      }
    },
    [dispatch, activeRepoPath, unstagedFiles]
  );

  const handleUnstageAllFiles = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeRepoPath && stagedFiles.length > 0) {
        const filePaths = stagedFiles.map((file) => file.path);
        dispatch(unstageFiles({ repoPath: activeRepoPath, files: filePaths }));
      }
    },
    [dispatch, activeRepoPath, stagedFiles]
  );

  return (
    <Stack gap="0" style={{ height: "100%" }} ref={containerRef}>
      <Accordion
        multiple
        value={accordionValues}
        onChange={handleChangesSidebarAccordionChange}
        style={{
          flex: 1,
          height: accordionHeight > 0 ? accordionHeight : "auto",
        }}
      >
        <Accordion.Item value="unstagedChanges">
          <Accordion.Control>
            <Group justify="space-between" style={{ width: "100%" }}>
              <Text size="sm">Unstaged Changes</Text>
              {unstagedFiles.length > 0 && (
                <Tooltip label="Stage all files" position="top">
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="green"
                    onClick={handleStageAllFiles}
                    style={{
                      marginRight: "8px",
                    }}
                    loading={staging}
                  >
                    <i className="fas fa-plus" />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack
              gap="xs"
              style={{
                height: accordionItemHeight > 0 ? accordionItemHeight : "auto",
              }}
            >
              {unstagedFiles.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {!activeRepo ? "Open a repository" : "No unstaged changes"}
                </Text>
              ) : (
                <UnstagedChangesList fileChanges={unstagedFiles} />
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="stagedChanges">
          <Accordion.Control>
            <Group justify="space-between" style={{ width: "100%" }}>
              <Text size="sm">Staged Changes</Text>
              {stagedFiles.length > 0 && (
                <Tooltip label="Unstage all files" position="top">
                  <ActionIcon
                    size="sm"
                    variant="light"
                    color="red"
                    onClick={handleUnstageAllFiles}
                    style={{
                      marginRight: "8px",
                    }}
                    loading={unstaging}
                  >
                    <i className="fas fa-minus" />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack
              gap="xs"
              style={{
                height: accordionItemHeight > 0 ? accordionItemHeight : "auto",
              }}
            >
              {!activeRepo || !stagedFiles.length ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {!activeRepo ? "Open a repository" : "No staged changes"}
                </Text>
              ) : (
                <StagedChangesList fileChanges={stagedFiles} />
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Paper p="md" withBorder ref={commitSectionRef}>
        <ChangesCommitArea />
      </Paper>
    </Stack>
  );
};
