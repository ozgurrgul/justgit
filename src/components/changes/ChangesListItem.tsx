import { Group, Badge, ActionIcon, Tooltip } from "@mantine/core";
import { FILE_STATUS, FileStatus, FileWithStatus } from "../../types/types";
import { TruncatedFilePath } from "./TruncatedFilePath";
import { useHover } from "@mantine/hooks";
import {
  ChangesListItemContextMenu,
  FileAction,
} from "./ChangesListItemContextMenu";

interface Props {
  fileChange: FileWithStatus;
  type: "staged" | "unstaged";
  onStageFile?: (file: string) => void;
  onUnstageFile?: (file: string) => void;
  onClickFile?: (filePath: string, staged: boolean) => void;
  onInteractiveStaging?: (filePath: string, staged: boolean) => void;
  onResolveConflict?: (filePath: string) => void;
  onDiscardChanges?: (file: string) => void;
}

// Status configuration for visual indicators
const getStatusConfig = (status: FileStatus) => {
  switch (status) {
    case FILE_STATUS.ADDED:
      return {
        icon: "fas fa-plus",
        color: "green",
        label: "Added",
        bgColor: "var(--mantine-color-green-light)",
      };
    case FILE_STATUS.MODIFIED:
      return {
        icon: "fas fa-edit",
        color: "blue",
        label: "Modified",
        bgColor: "var(--mantine-color-blue-light)",
      };
    case FILE_STATUS.DELETED:
      return {
        icon: "fas fa-trash",
        color: "red",
        label: "Deleted",
        bgColor: "var(--mantine-color-red-light)",
      };
    case FILE_STATUS.STAGED:
      return {
        icon: "fas fa-check",
        color: "teal",
        label: "Staged",
        bgColor: "var(--mantine-color-teal-light)",
      };
    case FILE_STATUS.DELETED_STAGED:
      return {
        icon: "fas fa-trash",
        color: "red",
        label: "Deleted (Staged)",
        bgColor: "var(--mantine-color-red-light)",
      };
    case FILE_STATUS.ADDED_STAGED:
      return {
        icon: "fas fa-plus",
        color: "green",
        label: "Added (Staged)",
        bgColor: "var(--mantine-color-green-light)",
      };
    case FILE_STATUS.MODIFIED_STAGED:
      return {
        icon: "fas fa-edit",
        color: "blue",
        label: "Modified (Staged)",
        bgColor: "var(--mantine-color-blue-light)",
      };
    case FILE_STATUS.RENAMED:
      return {
        icon: "fas fa-arrow-right",
        color: "purple",
        label: "Renamed",
        bgColor: "var(--mantine-color-violet-light)",
      };
    case FILE_STATUS.RENAMED_STAGED:
      return {
        icon: "fas fa-arrow-right",
        color: "purple",
        label: "Renamed (Staged)",
        bgColor: "var(--mantine-color-violet-light)",
      };
    case FILE_STATUS.CONFLICTED:
      return {
        icon: "fas fa-exclamation-triangle",
        color: "red",
        label: "Conflicted",
        bgColor: "var(--mantine-color-red-light)",
      };
    case FILE_STATUS.UNKNOWN:
    default:
      return {
        icon: "fas fa-question",
        color: "gray",
        label: "Unknown",
        bgColor: "var(--mantine-color-gray-light)",
      };
  }
};

export const ChangesListItem: React.FC<Props> = ({
  fileChange,
  type,
  onStageFile,
  onUnstageFile,
  onClickFile,
  onInteractiveStaging,
  onResolveConflict,
  onDiscardChanges,
}) => {
  const { hovered, ref } = useHover();
  const statusConfig = getStatusConfig(fileChange.status);

  const handleActionClick = (file: string) => {
    if (type === "staged" && onUnstageFile) {
      onUnstageFile(file);
    } else if (type === "unstaged" && onStageFile) {
      onStageFile(file);
    }
  };

  const handleFileClick = () => {
    if (onClickFile) {
      onClickFile(fileChange.path, type === "staged");
    }
  };

  const handleInteractiveStaging = () => {
    if (onInteractiveStaging) {
      onInteractiveStaging(fileChange.path, type === "staged");
    }
  };

  const handleResolveConflict = () => {
    if (onResolveConflict) {
      onResolveConflict(fileChange.path);
    }
  };

  const handleDiscardChanges = () => {
    if (onDiscardChanges) {
      onDiscardChanges(fileChange.path);
    }
  };

  const showAction = (onStageFile || onUnstageFile) && hovered;

  // Determine available actions for context menu
  const contextMenuActions: FileAction[] = [];
  if (onClickFile) contextMenuActions.push("view");
  if (type === "unstaged" && onStageFile) contextMenuActions.push("stage");
  if (type === "staged" && onUnstageFile) contextMenuActions.push("unstage");

  // Add interactive staging for modified files
  if (
    onInteractiveStaging &&
    (fileChange.status === FILE_STATUS.MODIFIED ||
      fileChange.status === FILE_STATUS.MODIFIED_STAGED)
  ) {
    contextMenuActions.push("interactive");
  }

  // Add conflict resolution for conflicted files
  if (onResolveConflict && fileChange.status === FILE_STATUS.CONFLICTED) {
    contextMenuActions.push("conflict");
  }

  // Add discard changes for unstaged files (except for added files)
  if (
    onDiscardChanges &&
    type === "unstaged" &&
    fileChange.status !== FILE_STATUS.ADDED
  ) {
    contextMenuActions.push("discard");
  }

  return (
    <ChangesListItemContextMenu
      fileChange={fileChange}
      actions={contextMenuActions}
      onStageFile={() => onStageFile?.(fileChange.path)}
      onUnstageFile={() => onUnstageFile?.(fileChange.path)}
      onClickFile={handleFileClick}
      onInteractiveStaging={handleInteractiveStaging}
      onResolveConflict={handleResolveConflict}
      onDiscardChanges={handleDiscardChanges}
    >
      <Group
        ref={ref}
        justify="space-between"
        style={{
          cursor: "pointer",
        }}
        onClick={handleFileClick}
      >
        <Group
          gap="xs"
          style={{
            flex: 1,
            minWidth: 0,
            transition: "all 0.2s ease",
            borderRadius: "4px",
          }}
          bg={hovered ? "var(--mantine-color-dark-6)" : "transparent"}
        >
          <Tooltip label={statusConfig.label} position="top">
            <Badge
              size="xs"
              color={statusConfig.color}
              variant="light"
              style={{
                backgroundColor: statusConfig.bgColor,
                minWidth: "20px",
                height: "20px",
                padding: "0 4px",
              }}
            >
              <i className={statusConfig.icon} style={{ fontSize: "10px" }}></i>
            </Badge>
          </Tooltip>
          {fileChange.originalPath ? (
            <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
              <TruncatedFilePath
                filePath={fileChange.originalPath}
                style={{ flex: 1, minWidth: 0, opacity: 0.7 }}
              />
              <i
                className="fas fa-arrow-right"
                style={{
                  fontSize: "10px",
                  color: "var(--mantine-color-gray-6)",
                }}
              ></i>
              <TruncatedFilePath
                filePath={fileChange.path}
                style={{ flex: 1, minWidth: 0 }}
              />
            </Group>
          ) : (
            <TruncatedFilePath
              filePath={fileChange.path}
              style={{ flex: 1, minWidth: 0 }}
            />
          )}
        </Group>
        <Group gap="xs" style={{ opacity: showAction ? 1 : 0 }}>
          <Tooltip
            label={type === "staged" ? "Unstage file" : "Stage file"}
            position="top"
          >
            <ActionIcon
              size="sm"
              variant="light"
              mr="18px"
              color={type === "staged" ? "red" : "green"}
              onClick={(e) => {
                handleActionClick(fileChange.path);
                e.stopPropagation();
              }}
            >
              <i
                className={type === "staged" ? "fas fa-minus" : "fas fa-plus"}
              ></i>
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </ChangesListItemContextMenu>
  );
};
