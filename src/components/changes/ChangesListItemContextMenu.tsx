import React, { useCallback, useEffect, useRef, useState } from "react";
import { FileWithStatus } from "../../types/types";
import { TruncatedFilePath } from "./TruncatedFilePath";

export type FileAction =
  | "stage"
  | "unstage"
  | "view"
  | "interactive"
  | "conflict"
  | "discard";

interface Props {
  fileChange: FileWithStatus;
  children: React.ReactNode;
  actions: FileAction[];
  onStageFile?: () => void;
  onUnstageFile?: () => void;
  onClickFile?: () => void;
  onInteractiveStaging?: () => void;
  onResolveConflict?: () => void;
  onDiscardChanges?: () => void;
}

export const ChangesListItemContextMenu: React.FC<Props> = ({
  fileChange,
  children,
  actions,
  onStageFile,
  onUnstageFile,
  onClickFile,
  onInteractiveStaging,
  onResolveConflict,
  onDiscardChanges,
}) => {
  const componentId = useRef(`file-context-${fileChange.path}-${Math.random()}`);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      
      const menuItems = [];
      
      const canStage = actions.includes("stage");
      const canUnstage = actions.includes("unstage");
      const canView = actions.includes("view") && onClickFile;
      const canInteractive = actions.includes("interactive") && onInteractiveStaging;
      const canResolveConflict = actions.includes("conflict") && onResolveConflict;
      const canDiscard = actions.includes("discard") && onDiscardChanges;

      if (canView) {
        menuItems.push({
          label: "View Changes",
          action: "view",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (canStage) {
        menuItems.push({
          label: "Stage File",
          action: "stage",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (canUnstage) {
        menuItems.push({
          label: "Unstage File",
          action: "unstage",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (canInteractive) {
        menuItems.push({
          label: "Interactive Staging",
          action: "interactive",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (canResolveConflict) {
        menuItems.push({
          label: "Resolve Conflict",
          action: "conflict",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (canDiscard) {
        if (menuItems.length > 0) {
          menuItems.push({ type: "separator" as const });
        }
        menuItems.push({
          label: "Discard Changes",
          action: "discard",
          data: { path: fileChange.path, componentId: componentId.current },
        });
      }

      if (menuItems.length > 0) {
        window.electronAPI.showContextMenu(menuItems);
      }
    },
    [actions, fileChange.path, onClickFile, onInteractiveStaging, onResolveConflict, onDiscardChanges]
  );

  const handleContextMenuAction = useCallback(
    (action: string, data?: any) => {
      // Only respond if this is for our component
      if (data?.componentId !== componentId.current) {
        return;
      }

      switch (action) {
        case "view":
          onClickFile?.();
          break;
        case "stage":
          onStageFile?.();
          break;
        case "unstage":
          onUnstageFile?.();
          break;
        case "interactive":
          onInteractiveStaging?.();
          break;
        case "conflict":
          onResolveConflict?.();
          break;
        case "discard":
          onDiscardChanges?.();
          break;
      }
    },
    [onStageFile, onUnstageFile, onClickFile, onInteractiveStaging, onResolveConflict, onDiscardChanges]
  );

  useEffect(() => {
    const listener = (action: string, data?: any) => {
      handleContextMenuAction(action, data);
    };
    
    const wrapper = window.electronAPI.onContextMenuAction(listener);
    
    return () => {
      window.electronAPI.offContextMenuAction(wrapper);
    };
  }, [handleContextMenuAction]);

  return (
    <div onContextMenu={handleContextMenu} style={{ width: "100%" }}>
      {children}
    </div>
  );
};
