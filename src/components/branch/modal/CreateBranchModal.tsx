import React, { useEffect, useRef } from "react";
import { Group, TextInput, Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";

interface Props {
  opened: boolean;
  onClose: () => void;
  onSubmit: (branchName: string, startPoint?: string) => void;
  startPoint?: string;
}

export const CreateBranchModal: React.FC<Props> = ({
  opened,
  onClose,
  onSubmit,
  startPoint,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      branchName: "",
    },
    validate: {
      branchName: (value) =>
        value.trim().length > 0 ? null : "Branch name is required",
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
    onSubmit(values.branchName.trim(), startPoint);
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Create Branch${startPoint ? ` from ${startPoint}` : ""}`}
      size="md"
      trapFocus
      withCloseButton={false}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          ref={inputRef}
          label="New branch name"
          placeholder="Enter branch name"
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
          <Button type="submit">Create</Button>
        </Group>
      </form>
    </Modal>
  );
};
