import {
  useAppSelector,
  selectCommitMessage,
  selectCommitOptions,
  selectCanCommit,
  useAppDispatch,
  setCommitMessage,
  setCommitOptions,
  commitChanges,
  selectActiveRepoPath,
  selectCommitting,
} from "@/store";
import { Button, Stack, Textarea, Checkbox } from "@mantine/core";
import { useCallback } from "react";

export const ChangesCommitArea = () => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const commitMessage = useAppSelector(selectCommitMessage);
  const commitOptions = useAppSelector(selectCommitOptions);
  const canCommit = useAppSelector(selectCanCommit);

  const loading = useAppSelector(selectCommitting);

  const handleCommitMessageChange = useCallback(
    (value: string) => {
      dispatch(setCommitMessage(value));
    },
    [dispatch]
  );

  const handleCommitOptionChange = useCallback(
    (option: keyof typeof commitOptions, value: boolean) => {
      dispatch(setCommitOptions({ [option]: value }));
    },
    [dispatch]
  );

  const handleCommitChanges = useCallback(() => {
    if (activeRepoPath && canCommit) {
      dispatch(
        commitChanges({
          repoPath: activeRepoPath,
          message: commitMessage.trim(),
          options: commitOptions,
        })
      );
    }
  }, [dispatch, activeRepoPath, canCommit, commitMessage, commitOptions]);

  return (
    <>
      <Stack gap="md">
        <Textarea
          value={commitMessage}
          onChange={(e) => handleCommitMessageChange(e.target.value)}
          placeholder="Enter commit message..."
          minRows={3}
          maxRows={6}
          autosize
        />
        <Stack gap="sm">
          <Checkbox
            label="Amend previous commit"
            checked={commitOptions.amend}
            onChange={(e) =>
              handleCommitOptionChange("amend", e.target.checked)
            }
          />
          <Checkbox
            label="Skip hooks"
            checked={commitOptions.skipHooks}
            onChange={(e) =>
              handleCommitOptionChange("skipHooks", e.target.checked)
            }
          />
        </Stack>
        <Button
          leftSection={<i className="fas fa-check"></i>}
          fullWidth
          onClick={handleCommitChanges}
          disabled={!canCommit}
          loading={loading}
        >
          Commit Changes
        </Button>
      </Stack>
    </>
  );
};
