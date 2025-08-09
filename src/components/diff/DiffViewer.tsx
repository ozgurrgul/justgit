import React, { useState } from "react";
import {
  ActionIcon,
  ScrollArea,
  Text,
  Stack,
  Group,
  Paper,
  SegmentedControl,
} from "@mantine/core";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";
import "./DiffViewer.module.css";
import { InteractiveDiffViewer } from "./InteractiveDiffViewer";

interface Props {
  diffContent: string;
  onClose: () => void;
  filePath?: string;
  staged?: boolean;
  mode: "view" | "interactive";
}

export const DiffViewer: React.FC<Props> = ({
  diffContent,
  onClose,
  filePath,
  staged = false,
  mode = "view",
}) => {
  const [viewType, setViewType] = useState<"unified" | "split">("split");

  // Handle interactive mode
  if (mode === "interactive" && filePath) {
    return (
      <InteractiveDiffViewer
        diffContent={diffContent}
        filePath={filePath}
        staged={staged}
        onClose={onClose}
      />
    );
  }

  // Handle regular view mode
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
          <Text size="xs">
            {file.oldPath && file.newPath && file.oldPath !== file.newPath
              ? `${file.oldPath} → ${file.newPath}`
              : file.newPath || file.oldPath}
          </Text>
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
        <Group justify="center" p="4px">
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
        </Group>
      </Paper>

      <ScrollArea h="calc(100vh - 150px)">
        <Diff
          key={file.oldRevision + "-" + file.newRevision}
          viewType={viewType}
          diffType={file.type}
          hunks={file.hunks}
          tokens={undefined}
          className="diff-viewer-inside"
        >
          {(hunks) =>
            hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
          }
        </Diff>
      </ScrollArea>
    </Stack>
  );
};
