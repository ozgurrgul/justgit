import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import { commitsToCommitGraphCommits } from "./commitUtils";

const selectApp = (state: RootState) => state.app;

// Basic selectors - now memoized with createSelector
export const selectRepositories = createSelector(
  [selectApp],
  (app) => app.repositories
);

export const selectActiveRepoPath = createSelector(
  [selectApp],
  (app) => app.activeRepoPath
);

export const selectCommitMessage = createSelector(
  [selectApp],
  (app) => app.commitMessage
);

export const selectCommitOptions = createSelector(
  [selectApp],
  (app) => app.commitOptions
);

export const selectCommitting = createSelector(
  [selectApp],
  (app) => app.committing
);

export const selectStatusText = createSelector(
  [selectApp],
  (app) => app.statusText
);

export const selectAccordionState = createSelector(
  [selectApp],
  (app) => app.accordionState
);

export const selectLoading = createSelector([selectApp], (app) => app.loading);

export const selectPushing = createSelector([selectApp], (app) => app.pushing);

export const selectPulling = createSelector([selectApp], (app) => app.pulling);

export const selectStaging = createSelector([selectApp], (app) => app.staging);

export const selectUnstaging = createSelector(
  [selectApp],
  (app) => app.unstaging
);

export const selectError = createSelector([selectApp], (app) => app.error);

export const selectActiveDiff = createSelector(
  [selectApp],
  (app) => app.activeDiff
);

export const selectActiveCommitHash = createSelector(
  [selectApp],
  (app) => app.activeCommitHash
);

export const selectConflicts = createSelector(
  [selectApp],
  (app) => app.conflicts
);

export const selectCommitDiff = createSelector(
  [selectApp],
  (app) => app.commitDiff
);

export const selectMainUiMode = createSelector(
  [selectApp],
  (app) => app.mainUiMode
);

export const selectSidebarUiMode = createSelector(
  [selectApp],
  (app) => app.sidebarUiMode
);

export const selectCommitPagination = createSelector(
  [selectApp],
  (app) => app.commitPagination
);

export const selectSettings = createSelector(
  [selectApp],
  (app) => app.settings
);

// Individual settings selectors
// UI Settings
export const selectTheme = createSelector(
  [selectSettings],
  (settings) => settings.theme
);

export const selectDiffViewMode = createSelector(
  [selectSettings],
  (settings) => settings.diffViewMode
);

// Behavior Settings
export const selectAutoFetch = createSelector(
  [selectSettings],
  (settings) => settings.autoFetch
);

export const selectAutoFetchInterval = createSelector(
  [selectSettings],
  (settings) => settings.autoFetchInterval
);

export const selectConfirmDeleteBranch = createSelector(
  [selectSettings],
  (settings) => settings.confirmDeleteBranch
);

// Advanced Settings
export const selectGitPath = createSelector(
  [selectSettings],
  (settings) => settings.gitPath
);

// Memoized selectors using createSelector
export const selectActiveRepo = createSelector([selectApp], (app) => {
  return app.activeRepoData;
});

export const selectRepoName = createSelector(
  [selectActiveRepoPath],
  (activeRepoPath) => {
    return activeRepoPath
      ? activeRepoPath.split("/").pop()
      : "No Repository Selected";
  }
);

export const selectCurrentBranch = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    return activeRepo?.currentBranch || "";
  }
);

export const selectHasActiveRepo = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    return activeRepo && !activeRepo.error;
  }
);

export const selectUnstagedFiles = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    if (!activeRepo?.status) return [];
    const {
      modified = [],
      not_added = [],
      deleted = [],
      renamed = [],
      conflicted,
    } = activeRepo.status;

    if (conflicted.length > 0) {
      return conflicted;
    }

    // Filter renamed files to only include unstaged renames (status "R")
    const unstagedRenames = renamed.filter((file) => file.status === "R");

    const allUnstaged = [
      ...modified,
      ...not_added,
      ...deleted,
      ...unstagedRenames,
    ];
    return allUnstaged;
  }
);

export const selectStagedFiles = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    if (!activeRepo?.status) return [];
    const { staged = [], renamed = [], conflicted = [] } = activeRepo.status;

    // Filter renamed files to only include staged renames (status "RS")
    const stagedRenames = renamed.filter((file) => file.status === "RS");

    return [...staged, ...stagedRenames];
  }
);

export const selectCanCommit = createSelector(
  [selectCommitMessage, selectHasActiveRepo, selectStagedFiles],
  (commitMessage, hasActiveRepo, stagedFiles) => {
    const hasMessage = commitMessage.trim().length > 0;
    const hasStaged = hasActiveRepo && stagedFiles.length > 0;
    return hasMessage && hasStaged;
  }
);

export const selectSidebarAccordionValues = createSelector(
  [selectAccordionState],
  (accordionState) => {
    return Object.entries(accordionState)
      .filter(
        ([key, isExpanded]) =>
          (key === "localBranches" || key === "remoteBranches") && isExpanded
      )
      .map(([key]) => key);
  }
);

export const selectChangesSidebarAccordionValues = createSelector(
  [selectAccordionState],
  (accordionState) => {
    return Object.entries(accordionState)
      .filter(
        ([key, isExpanded]) =>
          (key === "stagedChanges" || key === "unstagedChanges") && isExpanded
      )
      .map(([key]) => key);
  }
);

export const selectCommitHistory = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    return activeRepo?.log?.all || [];
  }
);

export const selectAlllBranches = createSelector(
  [selectActiveRepo],
  (activeRepo) => {
    return activeRepo?.branches?.all || [];
  }
);

export const selectHasMoreCommits = createSelector(
  [selectCommitPagination],
  (pagination) => pagination.hasMore
);

export const selectIsLoadingMoreCommits = createSelector(
  [selectCommitPagination],
  (pagination) => pagination.loading
);

export const selectCommitSignature = createSelector(
  [selectApp, (_, commitHash) => commitHash],
  (app, commitHash) => app?.commitSignatures?.[commitHash] || null
);

export const selectCommitGraphCommits = createSelector(
  [selectCommitHistory, selectAlllBranches],
  (commits, branches) => {
    return commitsToCommitGraphCommits(commits, branches);
  }
);
