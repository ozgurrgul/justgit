import {
  useAppSelector,
  selectActiveRepoPath,
  unstageFiles,
  useAppDispatch,
  setActiveDiff,
  getDiff,
  setMainUiMode,
} from "@/store";
import { useCallback } from "react";
import { ChangesList } from "./ChangesList";
import { FileWithStatus } from "@/types/types";

interface Props {
  fileChanges: FileWithStatus[];
}

export const StagedChangesList: React.FC<Props> = ({ fileChanges }) => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);

  const handleUnstageFile = useCallback(
    (file: string) => {
      if (activeRepoPath) {
        dispatch(unstageFiles({ repoPath: activeRepoPath, files: [file] }));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleShowDiff = useCallback(
    (filePath: string) => {
      if (activeRepoPath) {
        dispatch(setActiveDiff({ filePath, mode: "view", staged: true }));
        dispatch(getDiff({ repoPath: activeRepoPath, filePath, staged: true }));
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

  return (
    <ChangesList
      fileChanges={fileChanges}
      type="staged"
      onUnstageFile={handleUnstageFile}
      onClickFile={handleShowDiff}
      onInteractiveStaging={handleInteractiveStaging}
      onResolveConflict={handleResolveConflict}
    />
  );
};
