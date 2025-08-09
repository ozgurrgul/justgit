import {
  useAppSelector,
  selectActiveRepoPath,
  selectRepositories,
  selectLoading,
  setActiveRepository,
  useAppDispatch,
  addRepository,
  closeRepository,
} from "@/store";
import { Tabs, Group, CloseButton, ActionIcon } from "@mantine/core";
import { useCallback } from "react";

export const RepoTabs = () => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const repositories = useAppSelector(selectRepositories);
  const loading = useAppSelector(selectLoading);

  const handleSetActiveRepository = useCallback(
    (repoPath: string) => {
      dispatch(setActiveRepository(repoPath));
    },
    [dispatch]
  );

  const handleAddRepository = useCallback(() => {
    dispatch(addRepository());
  }, [dispatch]);

  const handleCloseRepository = useCallback(
    (repoPath: string) => {
      dispatch(closeRepository(repoPath));
    },
    [dispatch]
  );

  // Utility functions
  const getRepoName = useCallback((repoPath: string): string => {
    return repoPath.split("/").pop() || repoPath;
  }, []);

  return (
    <Tabs
      value={activeRepoPath}
      onChange={(value) => value && handleSetActiveRepository(value)}
      // To support native dragging of window via Electron, we override the default draggable behavior
      style={{ WebkitAppRegion: "no-drag" }}
    >
      <Group align="center" gap="0px">
        <Tabs.List>
          {repositories.map((repoPath) => (
            <Tabs.Tab
              key={repoPath}
              value={repoPath}
              rightSection={
                <CloseButton
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseRepository(repoPath);
                  }}
                />
              }
            >
              {getRepoName(repoPath)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <ActionIcon
          variant="filled"
          onClick={handleAddRepository}
          title="Open Repository"
          ml="md"
          loading={loading}
        >
          <i className="fas fa-plus"></i>
        </ActionIcon>
      </Group>
    </Tabs>
  );
};
