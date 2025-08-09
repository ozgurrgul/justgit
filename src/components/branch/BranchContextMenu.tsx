import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useAppDispatch,
  deleteBranch,
  deleteRemoteBranch,
  renameBranch,
  createBranch,
  mergeBranch,
  selectActiveRepoPath,
  useAppSelector,
  switchBranch,
  pullChanges,
  pushChanges,
} from "@/store";
import { CreateBranchModal } from "./modal/CreateBranchModal";
import { RenameBranchModal } from "./modal/RenameBranchModal";
import { DeleteBranchModal } from "./modal/DeleteBranchModal";

export type BranchAction =
  | "switch"
  | "create"
  | "merge"
  | "rename"
  | "delete"
  | "deleteOrigin"
  | "pull"
  | "push";

interface Props {
  branch: string;
  children: React.ReactNode;
  isActiveBranch: boolean;
  actions: BranchAction[];
}

export const BranchContextMenu: React.FC<Props> = ({
  branch,
  children,
  isActiveBranch,
  actions,
}) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteOriginModalOpen, setDeleteOriginModalOpen] = useState(false);
  const componentId = useRef(`branch-context-${branch}-${Math.random()}`);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const menuItems = [];

      const canSwitch = actions.includes("switch") && !isActiveBranch;
      const canCreate = actions.includes("create");
      const canMerge = actions.includes("merge") && !isActiveBranch;
      const canRename = actions.includes("rename");
      const canDelete = actions.includes("delete") && !isActiveBranch;
      const canDeleteOrigin = actions.includes("deleteOrigin") && !isActiveBranch;
      const canPull = actions.includes("pull") && isActiveBranch;
      const canPush = actions.includes("push") && isActiveBranch;

      if (canSwitch) {
        menuItems.push({
          label: "Switch to Branch",
          action: "switch",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canCreate) {
        menuItems.push({
          label: "Create Branch From Here",
          action: "create",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canMerge) {
        menuItems.push({
          label: "Merge into Current Branch",
          action: "merge",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canPull) {
        menuItems.push({
          label: "Pull Changes",
          action: "pull",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canPush) {
        menuItems.push({
          label: "Push Changes",
          action: "push",
          data: { branch, componentId: componentId.current },
        });
      }

      if (
        (canRename || canDelete || canDeleteOrigin) &&
        (canSwitch || canCreate || canMerge || canPull || canPush)
      ) {
        menuItems.push({ type: "separator" as const });
      }

      if (canRename) {
        menuItems.push({
          label: "Rename Branch",
          action: "rename",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canDelete) {
        menuItems.push({
          label: "Delete Branch",
          action: "delete",
          data: { branch, componentId: componentId.current },
        });
      }

      if (canDeleteOrigin) {
        menuItems.push({
          label: "Delete Origin Branch",
          action: "deleteOrigin",
          data: { branch, componentId: componentId.current },
        });
      }

      if (menuItems.length > 0) {
        window.electronAPI.showContextMenu(menuItems);
      }
    },
    [actions, branch, isActiveBranch]
  );

  const handleContextMenuAction = useCallback(
    (action: string, data?: any) => {
      // Only respond if this is for our component
      if (data?.componentId !== componentId.current) {
        return;
      }

      switch (action) {
        case "switch":
          if (activeRepoPath) {
            dispatch(
              switchBranch({ repoPath: activeRepoPath, branch: data.branch })
            );
          }
          break;
        case "create":
          setCreateModalOpen(true);
          break;
        case "merge":
          if (activeRepoPath) {
            dispatch(
              mergeBranch({ repoPath: activeRepoPath, branch: data.branch })
            );
          }
          break;
        case "pull":
          if (activeRepoPath) {
            dispatch(pullChanges(activeRepoPath));
          }
          break;
        case "push":
          if (activeRepoPath) {
            dispatch(pushChanges(activeRepoPath));
          }
          break;
        case "rename":
          setRenameModalOpen(true);
          break;
        case "delete":
          setDeleteModalOpen(true);
          break;
        case "deleteOrigin":
          setDeleteOriginModalOpen(true);
          break;
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleRenameBranchSubmit = (oldName: string, newName: string) => {
    if (activeRepoPath) {
      dispatch(renameBranch({ repoPath: activeRepoPath, oldName, newName }));
    }
    setRenameModalOpen(false);
  };

  const handleCreateBranchSubmit = (
    branchName: string,
    startPoint?: string
  ) => {
    if (activeRepoPath) {
      dispatch(
        createBranch({ repoPath: activeRepoPath, branchName, startPoint })
      );
    }
    setCreateModalOpen(false);
  };

  const handleDeleteBranchSubmit = () => {
    if (activeRepoPath) {
      dispatch(deleteBranch({ repoPath: activeRepoPath, branch }));
    }
    setDeleteModalOpen(false);
  };

  const handleDeleteOriginBranchSubmit = () => {
    if (activeRepoPath) {
      // For remote branches, we need to extract the remote name and branch name
      // Remote branches are typically in format "origin/branch-name"
      const remoteBranchParts = branch.split('/');
      const remoteName = remoteBranchParts[0];
      const remoteBranchName = remoteBranchParts.slice(1).join('/');
      
      dispatch(deleteRemoteBranch({ 
        repoPath: activeRepoPath, 
        remoteName, 
        branchName: remoteBranchName 
      }));
    }
    setDeleteOriginModalOpen(false);
  };

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

      {/* Rename Branch Modal */}
      {actions.includes("rename") && (
        <RenameBranchModal
          opened={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          onSubmit={handleRenameBranchSubmit}
          currentBranchName={branch}
        />
      )}

      {/* Create Branch Modal */}
      {actions.includes("create") && (
        <CreateBranchModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateBranchSubmit}
          startPoint={branch}
        />
      )}

      {/* Delete Branch Modal */}
      {actions.includes("delete") && (
        <DeleteBranchModal
          opened={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteBranchSubmit}
          branchName={branch}
        />
      )}

      {/* Delete Origin Branch Modal */}
      {actions.includes("deleteOrigin") && (
        <DeleteBranchModal
          opened={deleteOriginModalOpen}
          onClose={() => setDeleteOriginModalOpen(false)}
          onConfirm={handleDeleteOriginBranchSubmit}
          branchName={branch}
        />
      )}
    </>
  );
};
