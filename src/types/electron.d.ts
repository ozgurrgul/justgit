import { RepoData, SavedRepository, GitCommit, FileStatus } from "./types";

export interface ElectronAPI {
  selectRepository: () => Promise<string | null>;
  getRepoStatus: (repoPath: string) => Promise<RepoData>;
  gitAdd: (
    repoPath: string,
    files: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  gitReset: (
    repoPath: string,
    files: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  gitDiscard: (
    repoPath: string,
    files: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  gitCommit: (
    repoPath: string,
    message: string,
    options?: {
      amend?: boolean;
      skipHooks?: boolean;
    }
  ) => Promise<{ success: boolean; error?: string; result?: any }>;
  gitCheckout: (
    repoPath: string,
    branch: string
  ) => Promise<{ success: boolean; error?: string }>;
  gitPull: (
    repoPath: string
  ) => Promise<{ success: boolean; error?: string; result?: any }>;
  gitPush: (
    repoPath: string
  ) => Promise<{ success: boolean; error?: string; result?: any }>;
  gitPushSetUpstream: (
    repoPath: string,
    remoteName: string,
    branchName: string
  ) => Promise<{ success: boolean; error?: string; result?: any }>;
  gitCheckUpstream: (repoPath: string) => Promise<{
    success: boolean;
    hasUpstream: boolean;
    currentBranch?: string;
    error?: string;
  }>;
  gitDeleteBranch: (
    repoPath: string,
    branch: string
  ) => Promise<{ success: boolean; error?: string }>;
  gitDeleteRemoteBranch: (
    repoPath: string,
    remoteName: string,
    branchName: string
  ) => Promise<{ success: boolean; error?: string }>;
  gitRenameBranch: (
    repoPath: string,
    oldName: string,
    newName: string
  ) => Promise<{ success: boolean; error?: string }>;
  gitCreateBranch: (
    repoPath: string,
    branchName: string,
    startPoint?: string
  ) => Promise<{ success: boolean; error?: string }>;
  gitMergeBranch: (
    repoPath: string,
    branch: string
  ) => Promise<{
    success: boolean;
    error?: string;
    result?: any;
    hasConflicts?: boolean;
    conflicts?: string[];
    warning?: string;
  }>;
  gitCherryPick: (
    repoPath: string,
    commitHash: string
  ) => Promise<{
    success: boolean;
    error?: string;
    result?: any;
    hasConflicts?: boolean;
    conflicts?: string[];
  }>;
  gitRevert: (
    repoPath: string,
    commitHash: string
  ) => Promise<{
    success: boolean;
    error?: string;
    result?: any;
    hasConflicts?: boolean;
    conflicts?: string[];
  }>;
  gitDiff: (
    repoPath: string,
    filePath?: string,
    staged?: boolean,
    commitHash?: string
  ) => Promise<{ success: boolean; diff?: string; error?: string }>;
  gitCommitDiff: (
    repoPath: string,
    commitHash: string
  ) => Promise<{
    success: boolean;
    diff?: string;
    files?: { status: FileStatus; path: string }[];
    error?: string;
  }>;
  getCommits: (
    repoPath: string,
    skip?: number,
    maxCount?: number
  ) => Promise<{
    success: boolean;
    log?: { all: GitCommit[] };
    error?: string;
  }>;
  getCommitSignature: (
    repoPath: string,
    commitHash: string
  ) => Promise<{
    success: boolean;
    signature?: {
      status: string | null;
      signer: string | null;
      key: string | null;
      fingerprint: string | null;
    };
    error?: string;
  }>;
  saveRepositories: (repositoriesPaths: string[]) => Promise<void>;
  getSavedRepositories: () => Promise<{ repositories: SavedRepository[] }>;

  // Interactive staging methods
  gitApplyPatch: (
    repoPath: string,
    patch: string,
    staged?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  gitGeneratePatch: (
    repoPath: string,
    filePath: string,
    startLine: number,
    endLine: number,
    staged?: boolean
  ) => Promise<{ success: boolean; patch?: string; error?: string }>;

  // Conflict resolution methods
  gitGetConflicts: (repoPath: string) => Promise<{
    success: boolean;
    conflicts?: Array<{ path: string; content: string | null }>;
    error?: string;
  }>;
  gitResolveConflict: (
    repoPath: string,
    filePath: string,
    resolution: "ours" | "theirs"
  ) => Promise<{ success: boolean; error?: string }>;
  gitSaveResolvedFile: (
    repoPath: string,
    filePath: string,
    content: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Context menu methods
  showContextMenu: (
    menuItems: Array<
      | {
          label: string;
          action: string;
          data?: any;
        }
      | { type: "separator" }
    >
  ) => Promise<void>;
  onContextMenuAction: (callback: (action: string, data?: any) => void) => any;
  offContextMenuAction: (wrapper: any) => void;

  // Settings methods
  getSettings: () => Promise<{
    success: boolean;
    settings?: {
      theme: string;
      diffViewMode: "unified" | "split";
      autoFetch: boolean;
      autoFetchInterval: number;
      confirmDeleteBranch: boolean;
      gitPath: string;
    };
    error?: string;
  }>;
  saveSettings: (settings: {
    theme: string;
    diffViewMode: "unified" | "split";
    autoFetch: boolean;
    autoFetchInterval: number;
    confirmDeleteBranch: boolean;
    gitPath: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
