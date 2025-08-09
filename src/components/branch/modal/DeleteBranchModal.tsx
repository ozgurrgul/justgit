import React from "react";
import { Group, Text, Button, Modal, Stack } from "@mantine/core";

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  branchName: string;
}

export const DeleteBranchModal: React.FC<Props> = ({
  opened,
  onClose,
  onConfirm,
  branchName,
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete Branch" size="sm">
      <Stack gap="md">
        <Text size="sm">
          Are you sure you want to delete the branch{" "}
          <strong>{branchName}</strong>?
        </Text>
        <Text size="sm" c="dimmed">
          This action cannot be undone.
        </Text>
        <Group gap="xs" mt="md" justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" onClick={handleConfirm}>
            Delete Branch
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
