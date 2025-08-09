import {
  useAppDispatch,
  useAppSelector,
  selectActiveRepoPath,
  stageFiles,
  setActiveDiff,
  getDiff,
  setMainUiMode,
  discardChanges,
} from "@/store";
import { useCallback } from "react";
import { ChangesList } from "./ChangesList";
import { FileWithStatus } from "../../types/types";

interface Props {
  fileChanges: FileWithStatus[];
}

export const UnstagedChangesList: React.FC<Props> = ({ fileChanges }) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);

  const handleStageFile = useCallback(
    (file: string) => {
      if (activeRepoPath) {
        dispatch(stageFiles({ repoPath: activeRepoPath, files: [file] }));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleShowDiff = useCallback(
    (filePath: string) => {
      if (activeRepoPath) {
        dispatch(setActiveDiff({ filePath, staged: false, mode: "view" }));
        dispatch(
          getDiff({ repoPath: activeRepoPath, filePath, staged: false })
        );
        dispatch(setMainUiMode("diff-viewer"));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleInteractiveStaging = useCallback(
    (filePath: string, staged: boolean) => {
      if (activeRepoPath) {
        dispatch(setActiveDiff({ filePath, staged, mode: "interactive" }));
        dispatch(getDiff({ repoPath: activeRepoPath, filePath, staged }));
        dispatch(setMainUiMode("diff-viewer"));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleResolveConflict = useCallback(
    (filePath: string) => {
      if (activeRepoPath) {
        dispatch(setActiveDiff({ filePath, staged: false, mode: "view" }));
        dispatch(setMainUiMode("conflict-resolver"));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleDiscardChanges = useCallback(
    (file: string) => {
      if (activeRepoPath) {
        dispatch(discardChanges({ repoPath: activeRepoPath, files: [file] }));
      }
    },
    [dispatch, activeRepoPath]
  );

  return (
    <ChangesList
      fileChanges={fileChanges}
      type="unstaged"
      onStageFile={handleStageFile}
      onClickFile={handleShowDiff}
      onInteractiveStaging={handleInteractiveStaging}
      onResolveConflict={handleResolveConflict}
      onDiscardChanges={handleDiscardChanges}
    />
  );
};
