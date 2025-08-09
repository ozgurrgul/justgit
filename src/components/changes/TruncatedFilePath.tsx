import { Text, Group } from "@mantine/core";
import { CSSProperties } from "react";

interface Props {
  filePath: string;
  style?: CSSProperties;
}

export const TruncatedFilePath: React.FC<Props> = ({ filePath, style }) => {
  // Split the file path into directory and filename
  const lastSlashIndex = filePath.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    // No directory, just filename
    return (
      <Text size="xs" style={style}>
        {filePath}
      </Text>
    );
  }

  const directory = filePath.substring(0, lastSlashIndex + 1); // Include the trailing slash
  const filename = filePath.substring(lastSlashIndex + 1);

  return (
    <Group
      gap={0}
      wrap="nowrap"
      style={{ ...style, display: "flex", alignItems: "center" }}
    >
      <Text
        size="xs"
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "20%",
          color: "var(--mantine-color-gray-6)",
        }}
      >
        {directory}
      </Text>
      <Text
        size="xs"
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {filename}
      </Text>
    </Group>
  );
};
