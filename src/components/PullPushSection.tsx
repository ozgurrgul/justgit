import {
  useAppDispatch,
  useAppSelector,
  selectActiveRepoPath,
  selectHasActiveRepo,
  selectLoading,
  selectCurrentBranch,
  pullChanges,
  pushChanges,
  checkUpstream,
  pushWithUpstream,
  selectPushing,
  selectPulling,
} from "@/store";
import { Button, Group } from "@mantine/core";
import { useCallback, useState } from "react";
import { PushConfirmModal } from "./branch/modal/PushConfirmModal";

export const PullPushSection = () => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const hasActiveRepo = useAppSelector(selectHasActiveRepo);
  const pushing = useAppSelector(selectPushing);
  const pulling = useAppSelector(selectPulling);
  const currentBranch = useAppSelector(selectCurrentBranch);
  const [pushModalOpened, setPushModalOpened] = useState(false);

  const handlePullChanges = useCallback(() => {
    if (activeRepoPath) {
      dispatch(pullChanges(activeRepoPath));
    }
  }, [dispatch, activeRepoPath]);

  const handlePushChanges = useCallback(async () => {
    if (!activeRepoPath) return;

    try {
      // Check if current branch has upstream
      const upstreamResult = await dispatch(checkUpstream(activeRepoPath));

      if (checkUpstream.fulfilled.match(upstreamResult)) {
        if (upstreamResult.payload.hasUpstream) {
          // Branch has upstream, push normally
          dispatch(pushChanges(activeRepoPath));
        } else {
          // No upstream, show modal
          setPushModalOpened(true);
        }
      } else {
        // If upstream check fails, fall back to regular push
        dispatch(pushChanges(activeRepoPath));
      }
    } catch (error) {
      // If upstream check fails, fall back to regular push
      dispatch(pushChanges(activeRepoPath));
    }
  }, [dispatch, activeRepoPath]);

  const handleConfirmPush = useCallback(() => {
    if (activeRepoPath && currentBranch) {
      dispatch(
        pushWithUpstream({
          repoPath: activeRepoPath,
          remoteName: "origin",
          branchName: currentBranch,
        })
      );
    }
  }, [dispatch, activeRepoPath, currentBranch]);

  return (
    <>
      <Group gap="xs" px="md">
        <Button
          leftSection={<i className="fas fa-download"></i>}
          variant="default"
          size="xs"
          onClick={handlePullChanges}
          disabled={!hasActiveRepo || pushing}
          loading={pulling}
          flex={1}
        >
          Pull
        </Button>
        <Button
          leftSection={<i className="fas fa-upload"></i>}
          variant="default"
          size="xs"
          onClick={handlePushChanges}
          disabled={!hasActiveRepo || pulling}
          loading={pushing}
          flex={1}
        >
          Push
        </Button>
      </Group>

      <PushConfirmModal
        opened={pushModalOpened}
        onClose={() => setPushModalOpened(false)}
        onConfirm={handleConfirmPush}
        branchName={currentBranch}
      />
    </>
  );
};
