import React, { useEffect, useRef } from "react";
import { Group, TextInput, Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (oldName: string, newName: string) => void;
  currentBranchName: string;
}

export const RenameBranchModal: React.FC<Props> = ({
  opened,
  onClose,
  onSubmit,
  currentBranchName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      branchName: currentBranchName,
    },
    validate: {
      branchName: (value) => {
        if (value.trim().length === 0) {
          return "Branch name is required";
        }
        if (value.trim() === currentBranchName) {
          return "New branch name must be different from current name";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened && inputRef.current) {
      // Use requestAnimationFrame followed by setTimeout for Electron
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 200);
      });
    }
  }, [opened]);

  const handleSubmit = (values: { branchName: string }) => {
    onSubmit(currentBranchName, values.branchName.trim());
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Update form when currentBranchName changes
  React.useEffect(() => {
    if (opened) {
      form.setValues({ branchName: currentBranchName });
    }
  }, [opened, currentBranchName]);

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Rename Branch"
      size="sm"
      trapFocus
      withCloseButton={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          ref={inputRef}
          label="New branch name"
          placeholder="Enter new branch name"
          key={form.key("branchName")}
          {...form.getInputProps("branchName")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              form.onSubmit(handleSubmit)();
            }
          }}
          data-autofocus
        />
        <Group gap="xs" mt="md" justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Rename</Button>
        </Group>
      </form>
    </Modal>
  );
}; 