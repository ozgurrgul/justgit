import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  Tabs,
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Text,
  NumberInput,
  Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { AppState, loadSettings, saveSettings } from "../../store/appSlice";
import { selectSettings } from "../../store/selectors";

interface Props {
  opened: boolean;
  onClose: () => void;
}

type SettingsFormData = AppState["settings"];

export const SettingsModal: React.FC<Props> = ({ opened, onClose }) => {
  const [activeTab, setActiveTab] = useState<string | null>("ui");
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);

  const form = useForm<SettingsFormData>({
    initialValues: {
      theme: "dark",
      diffViewMode: "split",
      autoFetch: false,
      autoFetchInterval: 5,
      confirmDeleteBranch: true,
      gitPath: "/usr/bin/git",
    },
  });

  // Load settings when modal opens
  useEffect(() => {
    if (opened) {
      setSettingsLoaded(false);
      dispatch(loadSettings());
    }
  }, [opened, dispatch]);

  // Update form when settings are loaded for the first time
  useEffect(() => {
    if (opened && settings && !settingsLoaded) {
      form.setValues(settings);
      form.resetDirty(settings);
      setSettingsLoaded(true);
    }
  }, [opened, settings, settingsLoaded]);

  const handleSubmit = async (values: SettingsFormData) => {
    try {
      await dispatch(saveSettings(values)).unwrap();
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleReset = () => {
    if (settings) {
      form.setValues(settings);
      form.resetDirty(settings);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Settings"
      size="lg"
      trapFocus
      withCloseButton={true}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="ui">Interface</Tabs.Tab>
            <Tabs.Tab value="behavior">Behavior</Tabs.Tab>
            <Tabs.Tab value="advanced">Advanced</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="ui" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Customize the appearance and display options
              </Text>

              <Select
                label="Theme"
                data={[
                  { value: "dark", label: "Dark" },
                  { value: "light", label: "Light" },
                  { value: "auto", label: "Auto (System)" },
                ]}
                value={form.values.theme}
                onChange={(value) =>
                  form.setFieldValue("theme", (value as string) || "dark")
                }
              />

              <Select
                label="Diff View Mode"
                data={[
                  { value: "split", label: "Split View" },
                  { value: "unified", label: "Unified View" },
                ]}
                value={form.values.diffViewMode}
                onChange={(value) =>
                  form.setFieldValue(
                    "diffViewMode",
                    (value as "split" | "unified") || "split"
                  )
                }
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="behavior" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Configure how the application behaves
              </Text>

              <Switch
                label="Auto-fetch from remote"
                description="Automatically fetch changes from remote repositories"
                checked={form.values.autoFetch}
                onChange={(event) =>
                  form.setFieldValue("autoFetch", event.currentTarget.checked)
                }
              />

              <NumberInput
                label="Auto-fetch interval (minutes)"
                min={1}
                max={15}
                disabled={!form.values.autoFetch}
                value={form.values.autoFetchInterval}
                onChange={(value) =>
                  form.setFieldValue("autoFetchInterval", Number(value) || 5)
                }
              />

              <Switch
                label="Confirm before deleting branches"
                checked={form.values.confirmDeleteBranch}
                onChange={(event) =>
                  form.setFieldValue(
                    "confirmDeleteBranch",
                    event.currentTarget.checked
                  )
                }
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="advanced" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Advanced configuration options
              </Text>

              <TextInput
                label="Git Executable Path"
                placeholder="/usr/bin/git"
                value={form.values.gitPath}
                onChange={(event) =>
                  form.setFieldValue("gitPath", event.currentTarget.value)
                }
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group gap="xs" mt="xl" justify="flex-end">
          <Button variant="default" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Settings</Button>
        </Group>
      </form>
    </Modal>
  );
};
