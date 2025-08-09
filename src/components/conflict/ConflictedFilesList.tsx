import {
  useAppDispatch,
  useAppSelector,
  selectActiveRepoPath,
  stageFiles,
  setActiveDiff,
  getDiff,
  setMainUiMode,
} from "@/store";
import { useCallback } from "react";
import { FileWithStatus } from "../../types/types";
import { ChangesList } from "../changes/ChangesList";

interface Props {
  fileChanges: FileWithStatus[];
}

export const ConflictedFilesList: React.FC<Props> = ({ fileChanges }) => {
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
      type="unstaged"
      onClickFile={handleResolveConflict}
      //   onInteractiveStaging={handleInteractiveStaging}
      //   onResolveConflict={handleResolveConflict}
    />
  );
};
