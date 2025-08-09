import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RepoData, AccordionState, FileStatus } from "../types/types";
import { errorNotify, successNotify } from "@/utils/notifications";

export interface AppState {
  repositories: string[];
  activeRepoPath: string | null;
  activeRepoData: RepoData | null;
  commitMessage: string;
  commitOptions: {
    amend: boolean;
    skipHooks: boolean;
  };
  committing: boolean;
  statusText: string;
  accordionState: AccordionState;
  loading: boolean;
  pushing: boolean;
  pulling: boolean;
  staging: boolean;
  unstaging: boolean;
  error: string | null;
  activeDiff: {
    isOpen: boolean;
    diff: string | null;
    filePath: string | null;
    staged: boolean;
    mode: "view" | "interactive";
  };
  commitDiff: {
    files: { status: FileStatus; path: string }[];
    commitHash: string | null;
  };
  mainUiMode: "commit-history" | "diff-viewer" | "conflict-resolver";
  sidebarUiMode: "commit-history" | "commit-details";
  activeCommitHash: string | null;
  commitPagination: {
    hasMore: boolean;
    loading: boolean;
    skip: number;
  };
  conflicts: {
    files: Array<{ path: string; content: string | null }>;
    loading: boolean;
  };
  commitSignatures: {
    [commitHash: string]: {
      status: string | null;
      signer: string | null;
      key: string | null;
      fingerprint: string | null;
    };
  };
  settings: {
    // UI settings
    theme: string;
    diffViewMode: "unified" | "split";

    // Behavior settings
    autoFetch: boolean;
    autoFetchInterval: number;
    confirmDeleteBranch: boolean;

    // Advanced settings
    gitPath: string;
  };
}

// Initial state
const initialState: AppState = {
  repositories: [],
  activeRepoPath: null,
  activeRepoData: null,
  commitMessage: "",
  commitOptions: {
    amend: false,
    skipHooks: false,
  },
  committing: false,
  statusText: "Ready",
  accordionState: {
    localBranches: true,
    remoteBranches: false,
    stagedChanges: true,
    unstagedChanges: true,
  },
  loading: false,
  pushing: false,
  pulling: false,
  staging: false,
  unstaging: false,
  error: null,
  activeDiff: {
    isOpen: false,
    diff: null,
    filePath: null,
    staged: false,
    mode: "view",
  },
  commitDiff: {
    // diff: null,
    files: [],
    commitHash: null,
  },
  mainUiMode: "commit-history",
  sidebarUiMode: "commit-history",
  activeCommitHash: null,
  commitPagination: {
    hasMore: false,
    loading: false,
    skip: 0,
  },
  conflicts: {
    files: [],
    loading: false,
  },
  commitSignatures: {},
  settings: {
    // UI settings
    theme: "dark",
    diffViewMode: "split",

    // Behavior settings
    autoFetch: false,
    autoFetchInterval: 5,
    confirmDeleteBranch: true,

    // Advanced settings
    gitPath: "/usr/bin/git",
  },
};

// Async thunks for Settings operations
export const loadSettings = createAsyncThunk("app/loadSettings", async () => {
  const result = await window.electronAPI.getSettings();
  if (result.error) {
    throw new Error(result.error);
  }
  return result.settings;
});

export const saveSettings = createAsyncThunk(
  "app/saveSettings",
  async (settings: AppState["settings"]) => {
    const result = await window.electronAPI.saveSettings(settings);
    if (result.error) {
      throw new Error(result.error);
    }
    return settings;
  }
);

// Helper async thunk for saving repositories
export const saveRepositories = createAsyncThunk(
  "app/saveRepositories",
  async (repositoryPaths: string[]) => {
    await window.electronAPI.saveRepositories(repositoryPaths);
    return repositoryPaths;
  }
);

// Async thunks for Git operations
export const loadRepositoryData = createAsyncThunk(
  "app/loadRepositoryData",
  async (repoPath: string) => {
    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData };
  }
);

export const addRepository = createAsyncThunk(
  "app/addRepository",
  async (_, { dispatch, getState }) => {
    const repoPath = await window.electronAPI.selectRepository();
    if (repoPath) {
      const repoData = await window.electronAPI.getRepoStatus(repoPath);

      const state = getState() as { app: AppState };
      const existingRepositoryPaths = state.app.repositories;
      await dispatch(saveRepositories([...existingRepositoryPaths, repoPath]));

      // After successful addition, save the repository list
      // This will be handled in the fulfilled case using the updated state
      return { repoPath, repoData };
    }
    throw new Error("No repository selected");
  }
);

export const closeRepository = createAsyncThunk(
  "app/closeRepository",
  async (repoPath: string, { dispatch, getState }) => {
    const state = getState() as { app: AppState };
    const existingRepositoryPaths = state.app.repositories;
    const newRepositoryPaths = existingRepositoryPaths.filter(
      (path) => path !== repoPath
    );
    await dispatch(saveRepositories(newRepositoryPaths));

    // After successful addition, save the repository list
    // This will be handled in the fulfilled case using the updated state
    return { newRepositoryPaths, deletedRepoPath: repoPath };
  }
);

export const switchBranch = createAsyncThunk(
  "app/switchBranch",
  async ({ repoPath, branch }: { repoPath: string; branch: string }) => {
    const result = await window.electronAPI.gitCheckout(repoPath, branch);
    if (result.error) {
      errorNotify("Switch branch", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData };
  }
);

export const pullChanges = createAsyncThunk(
  "app/pullChanges",
  async (repoPath: string, { dispatch }) => {
    const result = await window.electronAPI.gitPull(repoPath);
    if (result.error) {
      errorNotify("Pull changes", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData };
  }
);

export const pushChanges = createAsyncThunk(
  "app/pushChanges",
  async (repoPath: string, { dispatch }) => {
    const result = await window.electronAPI.gitPush(repoPath);
    if (result.error) {
      errorNotify("Push changes", result.error);
      throw new Error(result.error);
    }

    successNotify("Pushed successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const checkUpstream = createAsyncThunk(
  "app/checkUpstream",
  async (repoPath: string) => {
    const result = await window.electronAPI.gitCheckUpstream(repoPath);
    if (result.error) {
      throw new Error(result.error);
    }
    return result;
  }
);

export const pushWithUpstream = createAsyncThunk(
  "app/pushWithUpstream",
  async (
    {
      repoPath,
      remoteName,
      branchName,
    }: {
      repoPath: string;
      remoteName: string;
      branchName: string;
    },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitPushSetUpstream(
      repoPath,
      remoteName,
      branchName
    );
    if (result.error) {
      errorNotify("Push changes", result.error);
      throw new Error(result.error);
    }

    successNotify("Pushed successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const commitChanges = createAsyncThunk(
  "app/commitChanges",
  async (
    {
      repoPath,
      message,
      options,
    }: {
      repoPath: string;
      message: string;
      options: AppState["commitOptions"];
    },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitCommit(
      repoPath,
      message,
      options
    );
    if (result.error) {
      errorNotify("Commit changes", result.error);
      throw new Error(result.error);
    }

    successNotify("Changes committed successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const deleteBranch = createAsyncThunk(
  "app/deleteBranch",
  async (
    { repoPath, branch }: { repoPath: string; branch: string },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitDeleteBranch(repoPath, branch);
    if (result.error) {
      errorNotify("Delete branch", result.error);
      throw new Error(result.error);
    }

    successNotify("Branch deleted successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const deleteRemoteBranch = createAsyncThunk(
  "app/deleteRemoteBranch",
  async (
    {
      repoPath,
      remoteName,
      branchName,
    }: { repoPath: string; remoteName: string; branchName: string },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitDeleteRemoteBranch(
      repoPath,
      remoteName,
      branchName
    );
    if (result.error) {
      errorNotify("Delete remote branch", result.error);
      throw new Error(result.error);
    }

    successNotify("Remote branch deleted successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const renameBranch = createAsyncThunk(
  "app/renameBranch",
  async (
    {
      repoPath,
      oldName,
      newName,
    }: {
      repoPath: string;
      oldName: string;
      newName: string;
    },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitRenameBranch(
      repoPath,
      oldName,
      newName
    );
    if (result.error) {
      errorNotify("Create branch", result.error);
      throw new Error(result.error);
    }

    successNotify("Branch renamed successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const createBranch = createAsyncThunk(
  "app/createBranch",
  async (
    {
      repoPath,
      branchName,
      startPoint,
    }: {
      repoPath: string;
      branchName: string;
      startPoint?: string;
    },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitCreateBranch(
      repoPath,
      branchName,
      startPoint
    );
    if (result.error) {
      errorNotify("Merge branch", result.error);
      throw new Error(result.error);
    }

    successNotify("Branch created successfully");
    dispatch(loadRepositoryData(repoPath));
    return { repoPath };
  }
);

export const mergeBranch = createAsyncThunk(
  "app/mergeBranch",
  async (
    { repoPath, branch }: { repoPath: string; branch: string },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitMergeBranch(repoPath, branch);
    if (result.error) {
      errorNotify("Merge branch", result.error);
      throw new Error(result.error);
    }

    // Check if there are conflicts
    if (result.hasConflicts) {
      const repoData = await window.electronAPI.getRepoStatus(repoPath);

      // Load conflicts and switch to conflict resolution mode
      await dispatch(getConflicts(repoPath));
      await dispatch(setMainUiMode("commit-history"));

      return { repoPath, repoData, hasConflicts: true };
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData, hasConflicts: false };
  }
);

export const cherryPickCommit = createAsyncThunk(
  "app/cherryPickCommit",
  async (
    { repoPath, commitHash }: { repoPath: string; commitHash: string },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitCherryPick(repoPath, commitHash);
    if (result.error) {
      errorNotify("Cherry-pick commit", result.error);
      throw new Error(result.error);
    }

    // Check if there are conflicts
    if (result.hasConflicts) {
      const repoData = await window.electronAPI.getRepoStatus(repoPath);

      // Load conflicts and switch to conflict resolution mode
      await dispatch(getConflicts(repoPath));
      await dispatch(setMainUiMode("commit-history"));

      return { repoPath, repoData, hasConflicts: true };
    }

    successNotify("Commit cherry-picked successfully");
    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData, hasConflicts: false };
  }
);

export const revertCommit = createAsyncThunk(
  "app/revertCommit",
  async (
    { repoPath, commitHash }: { repoPath: string; commitHash: string },
    { dispatch }
  ) => {
    const result = await window.electronAPI.gitRevert(repoPath, commitHash);
    if (result.error) {
      errorNotify("Revert commit", result.error);
      throw new Error(result.error);
    }

    // Check if there are conflicts
    if (result.hasConflicts) {
      const repoData = await window.electronAPI.getRepoStatus(repoPath);

      // Load conflicts and switch to conflict resolution mode
      await dispatch(getConflicts(repoPath));
      await dispatch(setMainUiMode("commit-history"));

      return { repoPath, repoData, hasConflicts: true };
    }

    successNotify("Commit reverted successfully");
    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, repoData, hasConflicts: false };
  }
);

export const getInitialData = createAsyncThunk(
  "app/getInitialData",
  async () => {
    const { repositories } = await window.electronAPI.getSavedRepositories();

    return {
      savedRepositories: repositories,
    };
  }
);

export const stageFiles = createAsyncThunk(
  "app/stageFiles",
  async ({ repoPath, files }: { repoPath: string; files: string[] }) => {
    const result = await window.electronAPI.gitAdd(repoPath, files);
    if (result.error) {
      errorNotify("Stage files", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

export const unstageFiles = createAsyncThunk(
  "app/unstageFiles",
  async ({ repoPath, files }: { repoPath: string; files: string[] }) => {
    const result = await window.electronAPI.gitReset(repoPath, files);
    if (result.error) {
      errorNotify("Unstage files", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

export const discardChanges = createAsyncThunk(
  "app/discardChanges",
  async ({ repoPath, files }: { repoPath: string; files: string[] }) => {
    const result = await window.electronAPI.gitDiscard(repoPath, files);
    if (result.error) {
      errorNotify("Discard changes", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

export const getDiff = createAsyncThunk(
  "app/getDiff",
  async ({
    repoPath,
    filePath,
    staged,
    commitHash,
  }: {
    repoPath: string;
    filePath?: string;
    staged?: boolean;
    commitHash?: string;
  }) => {
    const result = await window.electronAPI.gitDiff(
      repoPath,
      filePath,
      staged,
      commitHash
    );
    if (result.error) {
      errorNotify("Get diff", result.error);
      throw new Error(result.error);
    }
    return { diff: result.diff, filePath, staged, commitHash };
  }
);

export const getCommitDiff = createAsyncThunk(
  "app/getCommitDiff",
  async ({
    repoPath,
    commitHash,
  }: {
    repoPath: string;
    commitHash: string;
  }) => {
    const result = await window.electronAPI.gitCommitDiff(repoPath, commitHash);
    if (result.error) {
      errorNotify("Get commit diff", result.error);
      throw new Error(result.error);
    }

    return { diff: result.diff, files: result.files || [], commitHash };
  }
);

export const getCommitSignature = createAsyncThunk(
  "app/getCommitSignature",
  async ({
    repoPath,
    commitHash,
  }: {
    repoPath: string;
    commitHash: string;
  }) => {
    const result = await window.electronAPI.getCommitSignature(
      repoPath,
      commitHash
    );
    if (result.error) {
      console.warn("Failed to get commit signature:", result.error);
      return { commitHash, signature: null };
    }

    return { commitHash, signature: result.signature };
  }
);

export const loadCommits = createAsyncThunk(
  "app/loadCommits",
  async ({ repoPath, skip }: { repoPath: string; skip: number }) => {
    const result = await window.electronAPI.getCommits(repoPath, skip, 50);
    if (result.error) {
      errorNotify("Get commits", result.error);
      throw new Error(result.error);
    }

    const commits = result.log?.all || [];
    const hasMore = result.log?.all.length !== 0;

    return {
      repoPath,
      commits,
      hasMore,
    };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { app: AppState };
      if (state.app.commitPagination.loading) {
        return false; // This prevents the thunk from running at all
      }
      return true;
    },
  }
);

// Interactive staging thunks
export const stageHunk = createAsyncThunk(
  "app/stageHunk",
  async ({
    repoPath,
    filePath,
    patch,
  }: {
    repoPath: string;
    filePath: string;
    patch: string;
  }) => {
    const result = await window.electronAPI.gitApplyPatch(
      repoPath,
      patch,
      true
    );
    if (result.error) {
      errorNotify("Stage hunk", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

export const unstageHunk = createAsyncThunk(
  "app/unstageHunk",
  async ({
    repoPath,
    filePath,
    patch,
  }: {
    repoPath: string;
    filePath: string;
    patch: string;
  }) => {
    // For unstaging, we need to reverse the patch
    const reversedPatch = patch
      .replace(/^\+/gm, "TEMP_PLUS")
      .replace(/^-/gm, "+")
      .replace(/^TEMP_PLUS/gm, "-");
    const result = await window.electronAPI.gitApplyPatch(
      repoPath,
      reversedPatch,
      true
    );
    if (result.error) {
      errorNotify("Unstage hunk", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

// Conflict resolution thunks
export const getConflicts = createAsyncThunk(
  "app/getConflicts",
  async (repoPath: string) => {
    const result = await window.electronAPI.gitGetConflicts(repoPath);
    if (result.error) {
      errorNotify("Get conflicts", result.error);
      throw new Error(result.error);
    }
    return { repoPath, conflicts: result.conflicts || [] };
  }
);

export const resolveConflict = createAsyncThunk(
  "app/resolveConflict",
  async ({
    repoPath,
    filePath,
    resolution,
  }: {
    repoPath: string;
    filePath: string;
    resolution: "ours" | "theirs";
  }) => {
    const result = await window.electronAPI.gitResolveConflict(
      repoPath,
      filePath,
      resolution
    );
    if (result.error) {
      errorNotify("Resolve conflict", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

export const saveResolvedFile = createAsyncThunk(
  "app/saveResolvedFile",
  async ({
    repoPath,
    filePath,
    content,
  }: {
    repoPath: string;
    filePath: string;
    content: string;
  }) => {
    const result = await window.electronAPI.gitSaveResolvedFile(
      repoPath,
      filePath,
      content
    );
    if (result.error) {
      errorNotify("Save resolved file", result.error);
      throw new Error(result.error);
    }

    const repoData = await window.electronAPI.getRepoStatus(repoPath);
    return { repoPath, status: repoData.status };
  }
);

// Create the slice
const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveRepository: (state, action: PayloadAction<string>) => {
      state.activeRepoPath = action.payload;
    },
    setCommitMessage: (state, action: PayloadAction<string>) => {
      state.commitMessage = action.payload;
    },
    setCommitOptions: (
      state,
      action: PayloadAction<
        Partial<{
          amend: boolean;
          skipHooks: boolean;
        }>
      >
    ) => {
      state.commitOptions = { ...state.commitOptions, ...action.payload };
    },
    setStatusText: (state, action: PayloadAction<string>) => {
      state.statusText = action.payload;
    },
    toggleAccordion: (state, action: PayloadAction<keyof AccordionState>) => {
      const section = action.payload;
      state.accordionState[section] = !state.accordionState[section];
    },
    setSidebarAccordionState: (state, action: PayloadAction<string[]>) => {
      state.accordionState.localBranches =
        action.payload.includes("localBranches");
      state.accordionState.remoteBranches =
        action.payload.includes("remoteBranches");
    },
    setChangesSidebarAccordionState: (
      state,
      action: PayloadAction<string[]>
    ) => {
      state.accordionState.stagedChanges =
        action.payload.includes("stagedChanges");
      state.accordionState.unstagedChanges =
        action.payload.includes("unstagedChanges");
    },
    clearError: (state) => {
      state.error = null;
    },
    setActiveDiff: (
      state,
      action: PayloadAction<{
        filePath?: string;
        staged?: boolean;
        mode: "view" | "interactive";
      }>
    ) => {
      state.activeDiff.isOpen = true;
      state.activeDiff.filePath = action.payload.filePath || null;
      state.activeDiff.staged = action.payload.staged || false;
      state.activeDiff.mode = action.payload.mode;
    },
    resetActiveDiff: (state) => {
      state.activeDiff.isOpen = false;
      state.activeDiff.diff = null;
      state.activeDiff.filePath = null;
      state.activeDiff.staged = false;
      state.activeDiff.mode = "view";
    },
    setMainUiMode: (state, action: PayloadAction<AppState["mainUiMode"]>) => {
      state.mainUiMode = action.payload;
    },
    setSidebarUiMode: (
      state,
      action: PayloadAction<AppState["sidebarUiMode"]>
    ) => {
      state.sidebarUiMode = action.payload;
    },
    setActiveCommitHash: (state, action: PayloadAction<string>) => {
      state.activeCommitHash = action.payload;
    },
    updateSettings: (
      state,
      action: PayloadAction<Partial<AppState["settings"]>>
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load repository data
      .addCase(loadRepositoryData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRepositoryData.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
        // Reset pagination state when loading new repository data
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(loadRepositoryData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load repository data";
        state.statusText = "Failed to load repository data";
      })

      // Add repository
      .addCase(addRepository.pending, (state) => {
        state.loading = true;
        state.statusText = "Opening repository...";
      })
      .addCase(addRepository.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
        state.activeRepoPath = action.payload.repoPath;
        state.repositories = [...state.repositories, action.payload.repoPath];
        state.statusText = "Repository opened successfully";
        // Reset pagination state when opening new repository
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: action.payload.repoData.log?.all.length || 0,
        };
      })
      .addCase(addRepository.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to open repository";
        state.statusText = "Failed to open repository";
      })
      .addCase(closeRepository.fulfilled, (state, action) => {
        state.repositories = action.payload.newRepositoryPaths;

        if (state.activeRepoPath === action.payload.deletedRepoPath) {
          const remainingRepos = state.repositories;
          state.activeRepoPath =
            remainingRepos.length > 0 ? remainingRepos[0] : null;
          state.activeRepoData = {};
        }
      })

      // Switch branch
      .addCase(switchBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Switching to ${action.meta.arg.branch}...`;
      })
      .addCase(switchBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
        state.statusText = `Switched to branch ${action.payload.repoData.currentBranch}`;
        // Reset pagination state when switching branches
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(switchBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to switch branch";
        state.statusText = "Failed to switch branch";
      })

      // Pull changes
      .addCase(pullChanges.pending, (state) => {
        state.pulling = true;
        state.statusText = "Pulling changes...";
      })
      .addCase(pullChanges.fulfilled, (state, action) => {
        state.pulling = false;
        if (action.payload) {
          state.activeRepoData = action.payload.repoData;
          state.statusText = "Pull completed successfully";
        }
        // Reset pagination state when pulling changes (might bring new commits)
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(pullChanges.rejected, (state, action) => {
        state.pulling = false;
        state.error = action.error.message || "Failed to pull changes";
        state.statusText = "Failed to pull changes";
      })

      // Push changes
      .addCase(pushChanges.pending, (state) => {
        state.pushing = true;
        state.statusText = "Pushing changes...";
      })
      .addCase(pushChanges.fulfilled, (state, action) => {
        state.pushing = false;
        state.statusText = "Push completed successfully";
      })
      .addCase(pushChanges.rejected, (state, action) => {
        state.pushing = false;
        state.error = action.error.message || "Failed to push changes";
        state.statusText = "Failed to push changes";
      })

      // Check upstream
      .addCase(checkUpstream.pending, (state) => {
        state.loading = true;
        state.statusText = "Checking upstream...";
      })
      .addCase(checkUpstream.fulfilled, (state) => {
        state.loading = false;
        state.statusText = "Ready";
      })
      .addCase(checkUpstream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to check upstream";
        state.statusText = "Failed to check upstream";
      })

      // Push with upstream
      .addCase(pushWithUpstream.pending, (state) => {
        state.loading = true;
        state.statusText = "Pushing and setting upstream...";
      })
      .addCase(pushWithUpstream.fulfilled, (state, action) => {
        state.loading = false;
        state.statusText = "Push completed successfully";
      })
      .addCase(pushWithUpstream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to push changes";
        state.statusText = "Failed to push changes";
      })

      // Commit changes
      .addCase(commitChanges.pending, (state) => {
        state.committing = true;
        state.statusText = "Committing changes...";
      })
      .addCase(commitChanges.fulfilled, (state) => {
        state.committing = false;
        state.commitMessage = ""; // Clear commit message after successful commit
        state.statusText = "Changes committed successfully";
        state.mainUiMode = "commit-history";
        state.sidebarUiMode = "commit-history";
        // Reset pagination state when committing changes (creates new commit)
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(commitChanges.rejected, (state, action) => {
        state.committing = false;
        state.error = action.error.message || "Failed to commit changes";
        state.statusText = "Failed to commit changes";
      })

      // Delete branch
      .addCase(deleteBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Deleting branch ${action.meta.arg.branch}...`;
      })
      .addCase(deleteBranch.fulfilled, (state) => {
        state.loading = false;
        state.statusText = "Branch deleted successfully";
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete branch";
        state.statusText = "Failed to delete branch";
      })

      // Delete remote branch
      .addCase(deleteRemoteBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Deleting remote branch ${action.meta.arg.remoteName}/${action.meta.arg.branchName}...`;
      })
      .addCase(deleteRemoteBranch.fulfilled, (state) => {
        state.loading = false;
        state.statusText = "Remote branch deleted successfully";
      })
      .addCase(deleteRemoteBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete remote branch";
        state.statusText = "Failed to delete remote branch";
      })

      // Rename branch
      .addCase(renameBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Renaming branch ${action.meta.arg.oldName} to ${action.meta.arg.newName}...`;
      })
      .addCase(renameBranch.fulfilled, (state) => {
        state.loading = false;
        state.statusText = "Branch renamed successfully";
      })
      .addCase(renameBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to rename branch";
        state.statusText = "Failed to rename branch";
      })

      // Create branch
      .addCase(createBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Creating branch ${action.meta.arg.branchName}...`;
      })
      .addCase(createBranch.fulfilled, (state) => {
        state.loading = false;
        state.statusText = "Branch created successfully";
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create branch";
        state.statusText = "Failed to create branch";
      })

      // Merge branch
      .addCase(mergeBranch.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Merging branch ${action.meta.arg.branch}...`;
      })
      .addCase(mergeBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
      })
      .addCase(mergeBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to merge branch";
        state.statusText = "Failed to merge branch";
      })

      // Cherry-pick commit
      .addCase(cherryPickCommit.pending, (state, action) => {
        state.loading = true;
        state.statusText = `Cherry-picking commit ${action.meta.arg.commitHash.substring(
          0,
          7
        )}...`;
      })
      .addCase(cherryPickCommit.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
        state.statusText = "Cherry-pick completed successfully";
        // Reset pagination state when cherry-picking commits (creates new commit)
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(cherryPickCommit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to cherry-pick commit";
        state.statusText = "Failed to cherry-pick commit";
      })

      // Revert commit
      .addCase(revertCommit.pending, (state) => {
        state.loading = true;
        state.statusText = "Reverting commit...";
      })
      .addCase(revertCommit.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRepoData = action.payload.repoData;
        state.statusText = "Revert completed successfully";
        // Reset pagination state when reverting commits (creates new commit)
        state.commitPagination = {
          hasMore: true,
          loading: false,
          skip: 0,
        };
      })
      .addCase(revertCommit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to revert commit";
        state.statusText = "Failed to revert commit";
      })

      // Get initial data
      .addCase(getInitialData.pending, (state) => {
        state.loading = true;
      })
      .addCase(getInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.repositories = action.payload.savedRepositories.map((savedRepo) =>
          String(savedRepo.path)
        );
        state.activeRepoPath =
          state.repositories.length > 0 ? state.repositories[0] : null;
        state.activeRepoData = null;
      })
      .addCase(getInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load initial data";
      })

      // Stage files
      .addCase(stageFiles.pending, (state) => {
        state.staging = true;
        state.statusText = "Staging files...";
      })
      .addCase(stageFiles.fulfilled, (state, action) => {
        state.staging = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
          state.statusText = "Files staged successfully";
        }
      })
      .addCase(stageFiles.rejected, (state, action) => {
        state.staging = false;
        state.error = action.error.message || "Failed to stage files";
        state.statusText = "Failed to stage files";
      })

      // Unstage files
      .addCase(unstageFiles.pending, (state) => {
        state.unstaging = true;
        state.statusText = "Unstaging files...";
      })
      .addCase(unstageFiles.fulfilled, (state, action) => {
        state.unstaging = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Files unstaged successfully";
      })
      .addCase(unstageFiles.rejected, (state, action) => {
        state.unstaging = false;
        state.error = action.error.message || "Failed to unstage files";
        state.statusText = "Failed to unstage files";
      })

      // Discard changes
      .addCase(discardChanges.pending, (state) => {
        state.statusText = "Discarding changes...";
      })
      .addCase(discardChanges.fulfilled, (state, action) => {
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Changes discarded successfully";
      })
      .addCase(discardChanges.rejected, (state, action) => {
        state.error = action.error.message || "Failed to discard changes";
        state.statusText = "Failed to discard changes";
      })

      // Get diff
      .addCase(getDiff.fulfilled, (state, action) => {
        state.activeDiff.diff = action.payload.diff || null;
        state.statusText = "Diff loaded successfully";
      })
      .addCase(getDiff.rejected, (state, action) => {
        state.error = action.error.message || "Failed to get diff";
        state.statusText = "Failed to get diff";
      })

      // Get commit diff
      .addCase(getCommitDiff.pending, (state) => {
        state.statusText = "Loading commit diff...";
      })
      .addCase(getCommitDiff.fulfilled, (state, action) => {
        state.commitDiff.files = action.payload.files || [];
        state.commitDiff.commitHash = action.payload.commitHash;
        state.statusText = "Commit diff loaded successfully";
      })
      .addCase(getCommitDiff.rejected, (state, action) => {
        state.error = action.error.message || "Failed to get commit diff";
        state.statusText = "Failed to get commit diff";
      })

      // Load more commits
      .addCase(loadCommits.pending, (state) => {
        state.commitPagination.loading = true;
        state.statusText = "Loading more commits...";
      })
      .addCase(loadCommits.fulfilled, (state, action) => {
        if (action.payload) {
          const { commits, hasMore } = action.payload;
          if (!state.activeRepoData?.log) {
            state.activeRepoData!.log = {
              all: [],
            };
          }

          state.activeRepoData!.log!.all = [
            ...state.activeRepoData!.log!.all,
            ...commits,
          ];
          state.commitPagination.hasMore = hasMore;
          state.commitPagination.skip += commits.length;
          state.statusText = "Commits loaded successfully";
        }
        state.commitPagination.loading = false;
      })
      .addCase(loadCommits.rejected, (state, action) => {
        state.commitPagination.loading = false;
        state.error = action.error.message || "Failed to load commits";
        state.statusText = "Failed to load commits";
      })

      // Stage hunk
      .addCase(stageHunk.pending, (state) => {
        state.loading = true;
        state.statusText = "Staging hunk...";
      })
      .addCase(stageHunk.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Hunk staged successfully";
      })
      .addCase(stageHunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to stage hunk";
        state.statusText = "Failed to stage hunk";
      })

      // Unstage hunk
      .addCase(unstageHunk.pending, (state) => {
        state.loading = true;
        state.statusText = "Unstaging hunk...";
      })
      .addCase(unstageHunk.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Hunk unstaged successfully";
      })
      .addCase(unstageHunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to unstage hunk";
        state.statusText = "Failed to unstage hunk";
      })

      // Get conflicts
      .addCase(getConflicts.pending, (state) => {
        state.conflicts.loading = true;
        state.statusText = "Loading conflicts...";
      })
      .addCase(getConflicts.fulfilled, (state, action) => {
        state.conflicts.loading = false;
        state.conflicts.files = action.payload.conflicts;
        state.statusText = "Conflicts loaded successfully";
      })
      .addCase(getConflicts.rejected, (state, action) => {
        state.conflicts.loading = false;
        state.error = action.error.message || "Failed to load conflicts";
        state.statusText = "Failed to load conflicts";
      })

      // Resolve conflict
      .addCase(resolveConflict.pending, (state) => {
        state.loading = true;
        state.statusText = "Resolving conflict...";
      })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Conflict resolved successfully";
      })
      .addCase(resolveConflict.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to resolve conflict";
        state.statusText = "Failed to resolve conflict";
      })

      // Save resolved file
      .addCase(saveResolvedFile.pending, (state) => {
        state.loading = true;
        state.statusText = "Saving resolved file...";
      })
      .addCase(saveResolvedFile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.activeRepoData) {
          state.activeRepoData.status = action.payload.status;
        }
        state.statusText = "Resolved file saved successfully";
      })
      .addCase(saveResolvedFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to save resolved file";
        state.statusText = "Failed to save resolved file";
      })

      // Get commit signature
      .addCase(getCommitSignature.fulfilled, (state, action) => {
        if (action.payload.signature) {
          state.commitSignatures[action.payload.commitHash] =
            action.payload.signature;
        }
      })

      // Load settings
      .addCase(loadSettings.pending, (state) => {
        state.loading = true;
        state.statusText = "Loading settings...";
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload };
        state.statusText = "Settings loaded successfully";
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load settings";
        state.statusText = "Failed to load settings";
      })

      // Save settings
      .addCase(saveSettings.pending, (state) => {
        state.loading = true;
        state.statusText = "Saving settings...";
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.statusText = "Settings saved successfully";
      })
      .addCase(saveSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to save settings";
        state.statusText = "Failed to save settings";
      });
  },
});

export const {
  setActiveRepository,
  setCommitMessage,
  setCommitOptions,
  setStatusText,
  toggleAccordion,
  setSidebarAccordionState,
  setChangesSidebarAccordionState,
  clearError,
  setActiveDiff,
  resetActiveDiff,
  setMainUiMode,
  setActiveCommitHash,
  setSidebarUiMode,
  updateSettings,
} = appSlice.actions;

export default appSlice.reducer;
