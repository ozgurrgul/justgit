import React, { useEffect, useCallback, useState, useRef } from "react";
import { AppShell, Stack, Text, Box, Group, ActionIcon } from "@mantine/core";
import "./App.module.css";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loadRepositoryData,
  getInitialData,
  resetActiveDiff,
  setMainUiMode,
  getConflicts,
  setSidebarUiMode,
  loadSettings,
} from "../store/appSlice";
import {
  selectActiveRepoPath,
  selectStatusText,
  selectMainUiMode,
  selectActiveDiff,
  selectSidebarUiMode,
  selectConflicts,
  selectStagedFiles,
  selectUnstagedFiles,
} from "../store/selectors";
import { GitHistory } from "./history/GitHistory";
import { DiffViewer } from "./diff/DiffViewer";
import { ChangesSidebar } from "./changes/ChangesSidebar";
import { CommitDetails } from "./commitDetails/CommitDetails";
import { BranchesSidebar } from "./branch/BranchesSidebar";
import { RepoTabs } from "./RepoTabs";
import { PullPushSection } from "./PullPushSection";
import { CurrentBranchName } from "./CurrentBranchName";
import { SettingsModal } from "./settings/SettingsModal";

import { ConflictResolutionViewer } from "./diff/ConflictResolutionViewer";
import { ConflictSidebar } from "./conflict/ConflictSidebar";

// Constants
const MIN_PANEL_WIDTH = 250;
const MAX_PANEL_WIDTH = 600;

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const activeDiff = useAppSelector(selectActiveDiff);
  const statusText = useAppSelector(selectStatusText);

  const mainUiMode = useAppSelector(selectMainUiMode);
  const sidebarUiMode = useAppSelector(selectSidebarUiMode);

  const conflicts = useAppSelector(selectConflicts);
  const hasConflicts = conflicts.files.length > 0;

  const stagedFiles = useAppSelector(selectStagedFiles);
  const unstagedFiles = useAppSelector(selectUnstagedFiles);

  const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0;

  // Panel width state
  const [navbarWidth, setNavbarWidth] = useState(300);
  const [asideWidth, setAsideWidth] = useState(400);
  const [isResizingNavbar, setIsResizingNavbar] = useState(false);
  const [isResizingAside, setIsResizingAside] = useState(false);
  const navbarResizeRef = useRef<HTMLDivElement>(null);
  const asideResizeRef = useRef<HTMLDivElement>(null);

  // Settings modal state
  const [settingsOpened, setSettingsOpened] = useState(false);

  // Load initial data on component mount
  useEffect(() => {
    dispatch(getInitialData());
    dispatch(loadSettings());
  }, [dispatch]);

  // Fetch repository data + Load initial commits
  useEffect(() => {
    if (activeRepoPath) {
      dispatch(loadRepositoryData(activeRepoPath));
      dispatch(getConflicts(activeRepoPath));
    }
  }, [activeRepoPath, dispatch]);

  // Resize handlers
  const handleNavbarResize = useCallback(
    (e: MouseEvent) => {
      if (isResizingNavbar) {
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(MAX_PANEL_WIDTH, e.clientX)
        );
        setNavbarWidth(newWidth);
      }
    },
    [isResizingNavbar]
  );

  const handleAsideResize = useCallback(
    (e: MouseEvent) => {
      if (isResizingAside) {
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(MAX_PANEL_WIDTH, window.innerWidth - e.clientX)
        );
        setAsideWidth(newWidth);
      }
    },
    [isResizingAside]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizingNavbar(false);
    setIsResizingAside(false);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  // Resize event listeners
  useEffect(() => {
    if (isResizingNavbar || isResizingAside) {
      document.addEventListener(
        "mousemove",
        isResizingNavbar ? handleNavbarResize : handleAsideResize
      );
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener(
          "mousemove",
          isResizingNavbar ? handleNavbarResize : handleAsideResize
        );
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      };
    }
  }, [
    isResizingNavbar,
    isResizingAside,
    handleNavbarResize,
    handleAsideResize,
    handleMouseUp,
  ]);

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{ width: navbarWidth, breakpoint: "sm" }}
      aside={{ width: asideWidth, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header
        pl="80px"
        pr="md"
        style={{
          WebkitAppRegion: "drag",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--mantine-color-body)",
          borderBottom: "1px solid var(--mantine-color-default-border)",
        }}
      >
        <RepoTabs />
        <Group gap="md">
          <Text size="xs" c="teal.6">
            {statusText}
          </Text>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={() => setSettingsOpened(true)}
            style={{ WebkitAppRegion: "no-drag" }}
            aria-label="Settings"
          >
            <i className="fa fa-cog" />
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar>
        <Stack gap="xs">
          <CurrentBranchName />
          <PullPushSection />
          <BranchesSidebar />
        </Stack>
      </AppShell.Navbar>

      {/* Navbar resize handle */}
      <Box
        ref={navbarResizeRef}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizingNavbar(true);
        }}
        style={{
          position: "fixed",
          left: navbarWidth,
          top: 40,
          bottom: 0,
          width: 4,
          cursor: "col-resize",
          backgroundColor: "transparent",
          zIndex: 2,
          transition: isResizingNavbar ? "none" : "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--mantine-color-blue-light)";
        }}
        onMouseLeave={(e) => {
          if (!isResizingNavbar) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      />

      <AppShell.Main bg="var(--mantine-color-dark-8)">
        {hasConflicts && mainUiMode === "commit-history" && (
          <Group
            ml="120px"
            bg="var(--mantine-color-orange-9)"
            p="0"
            mt="8px"
            mr="8px"
            style={{
              borderRadius: "var(--mantine-radius-md)",
              cursor: "pointer",
            }}
            onClick={() => {
              dispatch(setSidebarUiMode("commit-history"));
            }}
          >
            <Text size="xs" p="4px">
              Conflicts detected
            </Text>
          </Group>
        )}
        {hasChanges && mainUiMode === "commit-history" && (
          <Group
            ml="120px"
            bg="var(--mantine-color-blue-light)"
            p="0"
            mt="8px"
            mr="8px"
            style={{
              borderRadius: "var(--mantine-radius-md)",
              cursor: "pointer",
            }}
            onClick={() => {
              dispatch(setSidebarUiMode("commit-history"));
            }}
          >
            <Text size="xs" p="4px">
              {stagedFiles.length} staged, {unstagedFiles.length} unstaged
              <i className="fa fa-pen" style={{ marginLeft: "4px" }} />
            </Text>
          </Group>
        )}
        {mainUiMode === "commit-history" && <GitHistory />}
        {mainUiMode === "diff-viewer" && activeDiff.diff && (
          <DiffViewer
            diffContent={activeDiff.diff}
            filePath={activeDiff.filePath || undefined}
            staged={activeDiff.staged}
            mode={activeDiff.mode}
            onClose={() => {
              dispatch(setMainUiMode("commit-history"));
              dispatch(resetActiveDiff());
            }}
          />
        )}
        {mainUiMode === "conflict-resolver" && activeDiff.filePath && (
          <ConflictResolutionViewer
            filePath={activeDiff.filePath}
            onClose={() => {
              dispatch(setMainUiMode("commit-history"));
              dispatch(resetActiveDiff());
            }}
          />
        )}
      </AppShell.Main>

      {/* Aside resize handle */}
      <Box
        ref={asideResizeRef}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizingAside(true);
        }}
        style={{
          position: "fixed",
          right: asideWidth,
          top: 40,
          bottom: 0,
          width: 4,
          cursor: "col-resize",
          backgroundColor: "transparent",
          zIndex: 2,
          transition: isResizingAside ? "none" : "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "var(--mantine-color-blue-light)";
        }}
        onMouseLeave={(e) => {
          if (!isResizingAside) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      />

      <AppShell.Aside>
        {sidebarUiMode === "commit-history" &&
          (hasConflicts ? <ConflictSidebar /> : <ChangesSidebar />)}
        {sidebarUiMode === "commit-details" && <CommitDetails />}
      </AppShell.Aside>

      {/* Settings Modal */}
      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
      />
    </AppShell>
  );
};

export default App;
