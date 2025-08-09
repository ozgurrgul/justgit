import { selectCurrentBranch, useAppSelector } from "@/store";
import { Badge, Group } from "@mantine/core";

export const CurrentBranchName = () => {
  const currentBranch = useAppSelector(selectCurrentBranch);

  return (
    <Group px="md" pt="md" justify="center">
      <Badge
        size="sm"
        fw={500}
        c="blue"
        variant="outline"
        style={{ textTransform: "revert" }}
        leftSection={<i className="fas fa-code-branch"></i>}
      >
        {currentBranch}
      </Badge>
    </Group>
  );
};
