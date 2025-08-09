import { Code, Group } from "@mantine/core";
import { ChangesListItem } from "./ChangesListItem";
import { FileWithStatus } from "@/types/types";

interface Props {
  fileChanges: FileWithStatus[];
  type: "staged" | "unstaged";
  onStageFile?: (file: string) => void;
  onUnstageFile?: (file: string) => void;
  onClickFile: (filePath: string) => void;
  onInteractiveStaging?: (filePath: string, staged: boolean) => void;
  onResolveConflict?: (filePath: string) => void;
  onDiscardChanges?: (file: string) => void;
}

export const ChangesList: React.FC<Props> = ({
  fileChanges,
  type,
  onStageFile,
  onUnstageFile,
  onClickFile,
  onInteractiveStaging,
  onResolveConflict,
  onDiscardChanges,
}) => {
  return (
    <Code bg="transparent" p="0px">
      <Group gap="2px" style={{ flex: 1 }}>
        {fileChanges.map((fileChange) => {
          return (
            <ChangesListItem
              key={`${type}-${fileChange.path}`}
              fileChange={fileChange}
              type={type}
              onStageFile={onStageFile}
              onUnstageFile={onUnstageFile}
              onClickFile={onClickFile}
              onInteractiveStaging={onInteractiveStaging}
              onResolveConflict={onResolveConflict}
              onDiscardChanges={onDiscardChanges}
            />
          );
        })}
      </Group>
    </Code>
  );
};
