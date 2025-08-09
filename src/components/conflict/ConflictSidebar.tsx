import { Stack, Text, Paper, Accordion } from "@mantine/core";
import {
  selectActiveRepo,
  selectChangesSidebarAccordionValues,
  selectConflicts,
  selectStagedFiles,
  setChangesSidebarAccordionState,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import { useCallback } from "react";
import { useElementSize } from "@mantine/hooks";
import { ChangesCommitArea } from "../changes/ChangesCommitArea";
import { ConflictedFilesList } from "./ConflictedFilesList";
import { StagedChangesList } from "../changes/StagedChangesList";

export const ConflictSidebar = () => {
  const dispatch = useAppDispatch();
  const activeRepo = useAppSelector(selectActiveRepo);
  const conflictedFiles = useAppSelector(selectConflicts);
  const stagedFiles = useAppSelector(selectStagedFiles);

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
    openAccordionCount === 1 ? accordionHeight - 130 : accordionHeight / 2
  );

  const handleChangesSidebarAccordionChange = useCallback(
    (value: string[]) => {
      dispatch(setChangesSidebarAccordionState(value));
    },
    [dispatch]
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
            <Text size="sm">Conflicted Files</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack
              gap="xs"
              style={{
                height: accordionItemHeight > 0 ? accordionItemHeight : "auto",
              }}
            >
              {conflictedFiles.files.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {!activeRepo ? "Open a repository" : "No conflicted files"}
                </Text>
              ) : (
                <ConflictedFilesList
                  fileChanges={conflictedFiles.files.map((file) => ({
                    ...file,
                    status: "conflicted",
                  }))}
                />
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="stagedChanges">
          <Accordion.Control>
            <Text size="sm">Resolved Files</Text>
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
