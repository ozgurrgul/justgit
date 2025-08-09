import React from "react";
import { Group, Text, Button, Modal, Stack } from "@mantine/core";

interface Props {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  branchName: string;
  remoteName?: string;
}

export const PushConfirmModal: React.FC<Props> = ({
  opened,
  onClose,
  onConfirm,
  branchName,
  remoteName = "origin",
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Push to Remote"
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm">
          The current branch <strong>{branchName}</strong> has no upstream branch.
        </Text>
        <Text size="sm">
          Do you want to push and set the upstream to <strong>{remoteName}/{branchName}</strong>?
        </Text>
        <Group gap="xs" mt="md" justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Push & Set Upstream
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}; 