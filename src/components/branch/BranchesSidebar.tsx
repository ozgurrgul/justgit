import { useCallback, useState } from "react";
import {
  Stack,
  Group,
  Text,
  Accordion,
  TextInput,
  ActionIcon,
} from "@mantine/core";
import {
  selectActiveRepo,
  selectSidebarAccordionValues,
  setSidebarAccordionState,
  useAppDispatch,
  useAppSelector,
} from "@/store";
import { BranchesList } from "./ BranchesList";

export const BranchesSidebar = () => {
  const dispatch = useAppDispatch();
  const activeRepo = useAppSelector(selectActiveRepo);
  const accordionValues = useAppSelector(selectSidebarAccordionValues);
  const [branchFilter, setBranchFilter] = useState("");

  const handleSidebarAccordionChange = useCallback(
    (value: string[]) => {
      dispatch(setSidebarAccordionState(value));
    },
    [dispatch]
  );

  const handleClearFilter = useCallback(() => {
    setBranchFilter("");
  }, []);

  const filterBranches = useCallback(
    (branches: string[]) => {
      if (!branchFilter.trim()) return branches;
      return branches.filter((branch) =>
        branch.toLowerCase().includes(branchFilter.toLowerCase())
      );
    },
    [branchFilter]
  );

  return (
    <>
      <Stack px="md" pb="0px">
        <TextInput
          placeholder="Filter branches..."
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.currentTarget.value)}
          leftSection={<i className="fas fa-search"></i>}
          rightSection={
            branchFilter ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={handleClearFilter}
                aria-label="Clear filter"
              >
                <i className="fas fa-times"></i>
              </ActionIcon>
            ) : null
          }
          size="xs"
        />
      </Stack>

      <Accordion
        multiple
        value={accordionValues}
        onChange={handleSidebarAccordionChange}
      >
        <Accordion.Item value="localBranches">
          <Accordion.Control>
            <Group gap="xs">
              <i className="fas fa-code-branch"></i>
              <Text size="sm">Local Branches</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            {!activeRepo || !activeRepo.branches?.local?.length ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                {!activeRepo ? "Open a repository" : "No local branches"}
              </Text>
            ) : (
              <BranchesList
                branches={filterBranches(
                  activeRepo.branches.local.map((branch) => branch.name)
                )}
                currentBranch={activeRepo.currentBranch}
                actions={[
                  "switch",
                  "create",
                  "merge",
                  "rename",
                  "delete",
                  "push",
                ]}
                height={200}
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="remoteBranches">
          <Accordion.Control>
            <Group gap="xs">
              <i className="fas fa-cloud"></i>
              <Text size="sm">Remote Branches</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            {!activeRepo || !activeRepo.branches?.remote?.length ? (
              <Text size="sm" c="dimmed" ta="center" py="md">
                {!activeRepo ? "Open a repository" : "No remote branches"}
              </Text>
            ) : (
              <BranchesList
                branches={filterBranches(
                  activeRepo.branches.remote.map((branch) => branch.name)
                )}
                currentBranch={activeRepo.currentBranch}
                actions={[
                  "switch",
                  "create",
                  "merge",
                  "rename",
                  "deleteOrigin",
                  "pull",
                ]}
                height={200}
              />
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  );
};
