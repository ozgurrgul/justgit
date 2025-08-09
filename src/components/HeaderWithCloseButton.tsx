import { ActionIcon, Group, Text } from "@mantine/core";

interface Props {
  title: React.ReactNode;
  onClose: () => void;
}

export const HeaderWithCloseButton: React.FC<Props> = ({ title, onClose }) => {
  return (
    <>
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          {title}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          radius="md"
          onClick={onClose}
          title="Close"
        >
          <i className="fas fa-times"></i>
        </ActionIcon>
      </Group>
    </>
  );
};
