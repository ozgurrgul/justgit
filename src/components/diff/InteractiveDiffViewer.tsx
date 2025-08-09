import React, { useState, useCallback, useMemo } from "react";
import {
  ActionIcon,
  ScrollArea,
  Text,
  Stack,
  Group,
  Paper,
  SegmentedControl,
  Button,
  Tooltip,
  Box,
} from "@mantine/core";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import "./DiffViewer.module.css";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectActiveRepoPath,
  selectLoading,
} from "../../store/selectors";
import { stageHunk, unstageHunk } from "../../store/appSlice";

interface Props {
  diffContent: string;
  onClose: () => void;
  filePath: string;
  staged?: boolean;
}

interface StageableHunkProps {
  hunk: any;
  filePath: string;
  staged?: boolean;
}

const StageableHunk: React.FC<StageableHunkProps> = ({ hunk, filePath, staged = false }) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const loading = useAppSelector(selectLoading);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  
  const { oldStart, oldLines, newStart, newLines } = hunk;
  const oldEnd = oldStart + oldLines - 1;
  const newEnd = newStart + newLines - 1;

  const handleLineClick = useCallback((lineNumber: number) => {
    setSelectedLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineNumber)) {
        newSet.delete(lineNumber);
      } else {
        newSet.add(lineNumber);
      }
      return newSet;
    });
  }, []);

  const handleStageHunk = useCallback(() => {
    if (!activeRepoPath) return;
    
    // Generate patch for entire hunk
    const hunkPatch = generateHunkPatch(hunk);
    
    if (staged) {
      dispatch(unstageHunk({
        repoPath: activeRepoPath,
        filePath,
        patch: hunkPatch,
      }));
    } else {
      dispatch(stageHunk({
        repoPath: activeRepoPath,
        filePath,
        patch: hunkPatch,
      }));
    }
  }, [activeRepoPath, filePath, hunk, staged, dispatch]);

  const handleStageSelectedLines = useCallback(() => {
    if (!activeRepoPath || selectedLines.size === 0) return;
    
    // Generate patch for selected lines only
    const selectedPatch = generateSelectedLinesPatch(hunk, selectedLines);
    
    if (staged) {
      dispatch(unstageHunk({
        repoPath: activeRepoPath,
        filePath,
        patch: selectedPatch,
      }));
    } else {
      dispatch(stageHunk({
        repoPath: activeRepoPath,
        filePath,
        patch: selectedPatch,
      }));
    }
  }, [activeRepoPath, filePath, hunk, selectedLines, staged, dispatch]);

  const generateHunkPatch = (hunk: any): string => {
    const lines = [];
    lines.push(`@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`);
    hunk.changes.forEach((change: any) => {
      lines.push(`${change.type === 'insert' ? '+' : change.type === 'delete' ? '-' : ' '}${change.content}`);
    });
    return lines.join('\n');
  };

  const generateSelectedLinesPatch = (hunk: any, selectedLines: Set<number>): string => {
    const lines = [];
    lines.push(`@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`);
    
    let oldLineNumber = oldStart;
    let newLineNumber = newStart;
    
    hunk.changes.forEach((change: any, index: number) => {
      if (change.type === 'insert') {
        if (selectedLines.has(newLineNumber)) {
          lines.push(`+${change.content}`);
        }
        newLineNumber++;
      } else if (change.type === 'delete') {
        if (selectedLines.has(oldLineNumber)) {
          lines.push(`-${change.content}`);
        }
        oldLineNumber++;
      } else {
        lines.push(` ${change.content}`);
        oldLineNumber++;
        newLineNumber++;
      }
    });
    
    return lines.join('\n');
  };

  const renderChange = useCallback((change: any) => {
    const lineNumber = change.type === 'insert' ? change.newLineNumber : change.oldLineNumber;
    const isSelected = selectedLines.has(lineNumber);
    
    return (
      <Box
        key={`${change.type}-${lineNumber}`}
        onClick={() => handleLineClick(lineNumber)}
        style={{
          cursor: 'pointer',
          backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--mantine-color-blue-6)' : 'none',
          paddingLeft: isSelected ? '2px' : '5px',
        }}
        className="diff-line"
      >
        {change.content}
      </Box>
    );
  }, [selectedLines, handleLineClick]);

  return (
    <Stack gap="xs">
      <Group justify="space-between" p="xs" bg="var(--mantine-color-gray-1)">
        <Text size="xs" c="dimmed">
          Lines {oldStart}-{oldEnd} → {newStart}-{newEnd}
        </Text>
        <Group gap="xs">
          {selectedLines.size > 0 && (
            <Tooltip label={`${staged ? 'Unstage' : 'Stage'} selected lines (${selectedLines.size})`}>
              <Button
                size="xs"
                variant="light"
                color={staged ? "red" : "green"}
                onClick={handleStageSelectedLines}
                disabled={loading}
              >
                {staged ? 'Unstage' : 'Stage'} ({selectedLines.size})
              </Button>
            </Tooltip>
          )}
          <Tooltip label={`${staged ? 'Unstage' : 'Stage'} entire hunk`}>
            <Button
              size="xs"
              variant="filled"
              color={staged ? "red" : "green"}
              onClick={handleStageHunk}
              disabled={loading}
            >
              {staged ? 'Unstage' : 'Stage'} Hunk
            </Button>
          </Tooltip>
        </Group>
      </Group>
      <Hunk hunk={hunk} />
    </Stack>
  );
};

export const InteractiveDiffViewer: React.FC<Props> = ({ 
  diffContent, 
  onClose, 
  filePath, 
  staged = false 
}) => {
  const [viewType, setViewType] = useState<"unified" | "split">("split");

  if (!diffContent || typeof diffContent !== "string") {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No diff content available
      </Text>
    );
  }

  const files = parseDiff(diffContent);

  if (files.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No changes to display
      </Text>
    );
  }

  const file = files[0];

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
          bg="var(--mantine-color-gray-9)"
          p="6px"
          style={{
            borderBottom: "1px solid var(--mantine-color-dark-4)",
          }}
        >
          <Group>
            <Text size="xs">
              {file.oldPath && file.newPath && file.oldPath !== file.newPath
                ? `${file.oldPath} → ${file.newPath}`
                : file.newPath || file.oldPath}
            </Text>
            <Text size="xs" c="dimmed">
              {staged ? "(Staged)" : "(Unstaged)"}
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
        <Group justify="space-between" p="4px">
          <SegmentedControl
            value={viewType}
            onChange={(value) => setViewType(value as "unified" | "split")}
            data={[
              {
                value: "unified",
                label: <i className="fas fa-bars"></i>,
              },
              {
                value: "split",
                label: <i className="fas fa-columns"></i>,
              },
            ]}
            size="xs"
          />
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Click lines to select • Use buttons to stage/unstage
            </Text>
          </Group>
        </Group>
      </Paper>

      <ScrollArea h="calc(100vh - 150px)">
        <Stack gap="md" p="md">
          {file.hunks.map((hunk, index) => (
            <StageableHunk
              key={index}
              hunk={hunk}
              filePath={filePath}
              staged={staged}
            />
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}; 