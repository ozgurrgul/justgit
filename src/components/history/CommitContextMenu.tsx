import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  selectActiveRepoPath,
  createBranch,
  switchBranch,
  setActiveCommitHash,
  setSidebarUiMode,
  getCommitDiff,
  cherryPickCommit,
  revertCommit,
} from "@/store";
import { notifications } from "@mantine/notifications";
import { CommitGraphCommitNode } from "./graph/CommitGraphTypes";
import { CreateBranchModal } from "../branch/modal/CreateBranchModal";

export type CommitAction =
  | "checkout"
  | "create-branch"
  | "cherry-pick"
  | "revert"
  | "copy-hash"
  | "copy-message"
  | "view-details"
  | "view-diff";

interface Props {
  commit: CommitGraphCommitNode;
  children: React.ReactNode;
  actions: CommitAction[];
}

export const CommitContextMenu: React.FC<Props> = ({
  commit,
  children,
  actions,
}) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const componentId = useRef(`commit-context-${commit.hash}-${Math.random()}`);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const menuItems = [];

      // Navigation actions
      if (actions.includes("checkout")) {
        menuItems.push({
          label: "Checkout This Commit",
          action: "checkout",
          data: { hash: commit.hash, componentId: componentId.current },
        });
      }

      // Branch and modification actions
      const modificationActions: CommitAction[] = [
        "create-branch",
        "cherry-pick",
        "revert",
      ];
      const hasModificationActions = modificationActions.some((action) =>
        actions.includes(action)
      );

      if (hasModificationActions) {
        if (menuItems.length > 0) {
          menuItems.push({ type: "separator" as const });
        }

        if (actions.includes("create-branch")) {
          menuItems.push({
            label: "Create Branch from Here",
            action: "create-branch",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }

        if (actions.includes("cherry-pick")) {
          menuItems.push({
            label: "Cherry-pick This Commit",
            action: "cherry-pick",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }

        if (actions.includes("revert")) {
          menuItems.push({
            label: "Revert This Commit",
            action: "revert",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }
      }

      // View actions
      const viewActions: CommitAction[] = ["view-details", "view-diff"];
      const hasViewActions = viewActions.some((action) =>
        actions.includes(action)
      );

      if (hasViewActions) {
        if (menuItems.length > 0) {
          menuItems.push({ type: "separator" as const });
        }

        if (actions.includes("view-details")) {
          menuItems.push({
            label: "View Commit Details",
            action: "view-details",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }

        if (actions.includes("view-diff")) {
          menuItems.push({
            label: "View Commit Diff",
            action: "view-diff",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }
      }

      // Copy actions
      if (actions.includes("copy-hash") || actions.includes("copy-message")) {
        if (menuItems.length > 0) {
          menuItems.push({ type: "separator" as const });
        }

        if (actions.includes("copy-hash")) {
          menuItems.push({
            label: "Copy Commit Hash",
            action: "copy-hash",
            data: { hash: commit.hash, componentId: componentId.current },
          });
        }

        if (actions.includes("copy-message")) {
          menuItems.push({
            label: "Copy Commit Message",
            action: "copy-message",
            data: {
              message: commit.message || "",
              componentId: componentId.current,
            },
          });
        }
      }

      if (menuItems.length > 0) {
        window.electronAPI.showContextMenu(menuItems);
      }
    },
    [actions, commit.hash, commit.message]
  );

  const handleContextMenuAction = useCallback(
    (action: string, data?: any) => {
      // Only respond if this is for our component
      if (data?.componentId !== componentId.current) {
        return;
      }

      switch (action) {
        case "checkout":
          if (activeRepoPath) {
            dispatch(
              switchBranch({ repoPath: activeRepoPath, branch: data.hash })
            );
          }
          break;
        case "create-branch":
          setCreateModalOpen(true);
          break;
        case "cherry-pick":
          if (activeRepoPath) {
            dispatch(
              cherryPickCommit({
                repoPath: activeRepoPath,
                commitHash: data.hash,
              })
            );
          }
          break;
        case "revert":
          if (activeRepoPath) {
            dispatch(
              revertCommit({
                repoPath: activeRepoPath,
                commitHash: data.hash,
              })
            );
          }
          break;
        case "copy-hash":
          navigator.clipboard.writeText(data.hash);
          notifications.show({
            title: "Copied",
            message: "Commit hash copied to clipboard",
            color: "green",
          });
          break;
        case "copy-message":
          navigator.clipboard.writeText(data.message);
          notifications.show({
            title: "Copied",
            message: "Commit message copied to clipboard",
            color: "green",
          });
          break;
        case "view-details":
          dispatch(setActiveCommitHash(data.hash));
          dispatch(setSidebarUiMode("commit-details"));
          break;
        case "view-diff":
          if (activeRepoPath) {
            dispatch(
              getCommitDiff({ repoPath: activeRepoPath, commitHash: data.hash })
            );
            dispatch(setActiveCommitHash(data.hash));
            dispatch(setSidebarUiMode("commit-details"));
          }
          break;
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleCreateBranchSubmit = useCallback(
    (branchName: string, startPoint?: string) => {
      if (activeRepoPath) {
        dispatch(
          createBranch({
            repoPath: activeRepoPath,
            branchName,
            startPoint: startPoint || commit.hash,
          })
        );
      }
      setCreateModalOpen(false);
    },
    [dispatch, activeRepoPath, commit.hash]
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
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      {actions.includes("create-branch") && (
        <CreateBranchModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateBranchSubmit}
          startPoint={commit.hash}
        />
      )}
    </>
  );
};
