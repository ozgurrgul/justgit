import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Stack,
  Group,
  Text,
  Button,
  Paper,
  ScrollArea,
  Divider,
  ActionIcon,
  Tooltip,
  Box,
  Code,
  Alert,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectActiveRepoPath,
  selectLoading,
  selectConflicts,
} from "../../store/selectors";
import {
  getConflicts,
  resolveConflict,
  saveResolvedFile,
  loadRepositoryData,
} from "../../store/appSlice";

interface Props {
  filePath: string;
  onClose: () => void;
}

interface ConflictSection {
  type: "normal" | "conflict";
  content: string;
  ourContent?: string;
  theirContent?: string;
  startLine: number;
  endLine: number;
}

const parseConflictContent = (content: string): ConflictSection[] => {
  const lines = content.split("\n");
  const sections: ConflictSection[] = [];
  let currentSection: ConflictSection | null = null;
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("<<<<<<< ")) {
      // Start of conflict - save any previous normal section
      if (currentSection && currentSection.type === "normal") {
        currentSection.endLine = lineIndex - 1;
        sections.push(currentSection);
      }

      // Start collecting "ours" content
      currentSection = {
        type: "conflict",
        content: "",
        ourContent: "",
        theirContent: "",
        startLine: lineIndex,
        endLine: lineIndex,
      };
      lineIndex++;
    } else if (line.startsWith("=======")) {
      // Switch from "ours" to "theirs"
      lineIndex++;
    } else if (line.startsWith(">>>>>>> ")) {
      // End of conflict
      if (currentSection && currentSection.type === "conflict") {
        currentSection.endLine = lineIndex;
        sections.push(currentSection);
        currentSection = null;
      }
      lineIndex++;
    } else {
      // Regular content line
      if (currentSection) {
        if (currentSection.type === "conflict") {
          // Determine if we're in "ours" or "theirs" section
          const isInOurs = !currentSection.ourContent?.includes("=======");
          if (isInOurs) {
            currentSection.ourContent +=
              (currentSection.ourContent ? "\n" : "") + line;
          } else {
            currentSection.theirContent +=
              (currentSection.theirContent ? "\n" : "") + line;
          }
        } else {
          currentSection.content += (currentSection.content ? "\n" : "") + line;
        }
      } else {
        // Start a new normal section
        currentSection = {
          type: "normal",
          content: line,
          startLine: lineIndex,
          endLine: lineIndex,
        };
      }
      lineIndex++;
    }
  }

  // Add any remaining section
  if (currentSection) {
    currentSection.endLine = lineIndex - 1;
    sections.push(currentSection);
  }

  return sections;
};

interface ConflictSectionProps {
  section: ConflictSection;
  onResolve: (resolution: string) => void;
}

const ConflictSectionComponent: React.FC<ConflictSectionProps> = ({
  section,
  onResolve,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<
    "ours" | "theirs" | "manual" | null
  >(null);
  const [manualContent, setManualContent] = useState("");

  const handleResolve = useCallback(() => {
    if (selectedResolution === "ours") {
      onResolve(section.ourContent || "");
    } else if (selectedResolution === "theirs") {
      onResolve(section.theirContent || "");
    } else if (selectedResolution === "manual") {
      onResolve(manualContent);
    }
  }, [
    selectedResolution,
    manualContent,
    section.ourContent,
    section.theirContent,
    onResolve,
  ]);

  if (section.type === "normal") {
    return (
      <Paper p="sm" bg="var(--mantine-color-gray-1)">
        <Code block style={{ whiteSpace: "pre-wrap" }}>
          {section.content}
        </Code>
      </Paper>
    );
  }

  return (
    <Paper p="sm" bg="var(--mantine-color-red-0)" withBorder>
      <Stack gap="sm">
        <Text size="sm" fw={500} c="red">
          Conflict at lines {section.startLine + 1}-{section.endLine + 1}
        </Text>

        <Group align="flex-start" gap="md">
          <Box flex={1}>
            <Text size="xs" c="blue" fw={500} mb="xs">
              Ours (Current Branch)
            </Text>
            <Code
              block
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {section.ourContent || "(empty)"}
            </Code>
            <Button
              size="xs"
              variant={selectedResolution === "ours" ? "filled" : "light"}
              color="blue"
              mt="xs"
              onClick={() => setSelectedResolution("ours")}
            >
              Use Ours
            </Button>
          </Box>

          <Box flex={1}>
            <Text size="xs" c="green" fw={500} mb="xs">
              Theirs (Incoming Branch)
            </Text>
            <Code
              block
              style={{
                whiteSpace: "pre-wrap",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {section.theirContent || "(empty)"}
            </Code>
            <Button
              size="xs"
              variant={selectedResolution === "theirs" ? "filled" : "light"}
              color="green"
              mt="xs"
              onClick={() => setSelectedResolution("theirs")}
            >
              Use Theirs
            </Button>
          </Box>
        </Group>

        <Divider />

        <Box>
          <Text size="xs" fw={500} mb="xs">
            Manual Resolution
          </Text>
          <Textarea
            placeholder="Enter your manual resolution here..."
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            autosize
            minRows={3}
            maxRows={8}
          />
          <Group mt="xs" gap="xs">
            <Button
              size="xs"
              variant={selectedResolution === "manual" ? "filled" : "light"}
              color="orange"
              onClick={() => setSelectedResolution("manual")}
            >
              Use Manual
            </Button>
            <Button
              size="xs"
              variant="filled"
              color="indigo"
              onClick={handleResolve}
              disabled={!selectedResolution}
            >
              Apply Resolution
            </Button>
          </Group>
        </Box>
      </Stack>
    </Paper>
  );
};

export const ConflictResolutionViewer: React.FC<Props> = ({
  filePath,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const loading = useAppSelector(selectLoading);
  const conflicts = useAppSelector(selectConflicts);

  const [resolvedSections, setResolvedSections] = useState<Map<number, string>>(
    new Map()
  );

  const conflictFile = useMemo(() => {
    return conflicts.files.find((f) => f.path === filePath);
  }, [conflicts.files, filePath]);

  const sections = useMemo(() => {
    if (!conflictFile?.content) return [];
    return parseConflictContent(conflictFile.content);
  }, [conflictFile?.content]);

  const handleSectionResolve = useCallback(
    (sectionIndex: number, resolution: string) => {
      setResolvedSections((prev) => {
        const newMap = new Map(prev);
        newMap.set(sectionIndex, resolution);
        return newMap;
      });
    },
    []
  );

  const handleResolveAll = useCallback(
    async (resolution: "ours" | "theirs") => {
      if (!activeRepoPath) return;

      try {
        await dispatch(
          resolveConflict({
            repoPath: activeRepoPath,
            filePath,
            resolution,
          })
        ).unwrap();

        // Refresh conflicts and repository data
        setTimeout(async () => {
          await dispatch(getConflicts(activeRepoPath));
          await dispatch(loadRepositoryData(activeRepoPath));
        }, 1000);

        onClose();
      } catch (error) {
        console.error("Error resolving conflict:", error);
      }
    },
    [activeRepoPath, filePath, dispatch, onClose]
  );

  const handleSaveManualResolution = useCallback(async () => {
    if (!activeRepoPath || resolvedSections.size === 0) return;

    // Build the resolved content
    let resolvedContent = "";

    sections.forEach((section, index) => {
      if (section.type === "normal") {
        resolvedContent += section.content;
      } else if (section.type === "conflict") {
        const resolution = resolvedSections.get(index);
        if (resolution !== undefined) {
          resolvedContent += resolution;
        } else {
          // Keep the original conflict if not resolved
          resolvedContent += `<<<<<<< HEAD\n${section.ourContent}\n=======\n${section.theirContent}\n>>>>>>> branch`;
        }
      }

      if (index < sections.length - 1) {
        resolvedContent += "\n";
      }
    });

    try {
      await dispatch(
        saveResolvedFile({
          repoPath: activeRepoPath,
          filePath,
          content: resolvedContent,
        })
      ).unwrap();

      // Refresh conflicts and repository data
      await dispatch(getConflicts(activeRepoPath));
      await dispatch(loadRepositoryData(activeRepoPath));

      onClose();
    } catch (error) {
      console.error("Error saving manual resolution:", error);
    }
  }, [activeRepoPath, filePath, sections, resolvedSections, dispatch, onClose]);

  const hasUnresolvedConflicts = useMemo(() => {
    return sections.some(
      (section, index) =>
        section.type === "conflict" && !resolvedSections.has(index)
    );
  }, [sections, resolvedSections]);

  const hasResolvedConflicts = useMemo(() => {
    return resolvedSections.size > 0;
  }, [resolvedSections]);

  useEffect(() => {
    if (activeRepoPath && !conflictFile) {
      dispatch(getConflicts(activeRepoPath));
    }
  }, [activeRepoPath, conflictFile, dispatch]);

  if (!conflictFile) {
    return (
      <Stack h="100%" align="center" justify="center">
        <Text c="dimmed">Loading conflict information...</Text>
      </Stack>
    );
  }

  return (
    <Stack h="100%" gap="0px" p="0px">
      <Paper
        radius="0px"
        style={{
          borderBottom: "1px solid var(--mantine-color-dark-4)",
        }}
      >
        <Group
          justify="space-between"
          align="center"
          bg="var(--mantine-color-red-1)"
          p="sm"
          style={{
            borderBottom: "1px solid var(--mantine-color-red-3)",
          }}
        >
          <Group>
            <Text size="sm" fw={500}>
              Resolve Conflict: {filePath}
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="md"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </ActionIcon>
        </Group>

        <Group justify="space-between" p="sm" bg="var(--mantine-color-gray-0)">
          <Group gap="sm">
            <Button
              size="xs"
              variant="light"
              color="blue"
              onClick={() => handleResolveAll("ours")}
              disabled={loading}
            >
              <i
                className="fas fa-check-circle"
                style={{ marginRight: "4px" }}
              ></i>
              Take All Ours
            </Button>
            <Button
              size="xs"
              variant="light"
              color="green"
              onClick={() => handleResolveAll("theirs")}
              disabled={loading}
            >
              <i
                className="fas fa-check-circle"
                style={{ marginRight: "4px" }}
              ></i>
              Take All Theirs
            </Button>
          </Group>

          <Group gap="sm">
            {hasResolvedConflicts && (
              <Button
                size="xs"
                variant="filled"
                color="indigo"
                onClick={handleSaveManualResolution}
                disabled={loading || hasUnresolvedConflicts}
              >
                <i className="fas fa-save" style={{ marginRight: "4px" }}></i>
                Save Manual Resolution
              </Button>
            )}
            <Text size="xs" c="dimmed">
              {sections.filter((s) => s.type === "conflict").length} conflict(s)
              • {resolvedSections.size} resolved
            </Text>
          </Group>
        </Group>
      </Paper>

      <ScrollArea h="calc(100vh - 150px)">
        <Stack gap="sm" p="md">
          {sections.length === 0 ? (
            <Alert color="gray" icon={<i className="fas fa-info-circle"></i>}>
              No conflicts found in this file.
            </Alert>
          ) : (
            sections.map((section, index) => (
              <ConflictSectionComponent
                key={index}
                section={section}
                onResolve={(resolution) =>
                  handleSectionResolve(index, resolution)
                }
              />
            ))
          )}
        </Stack>
      </ScrollArea>
    </Stack>
  );
};
