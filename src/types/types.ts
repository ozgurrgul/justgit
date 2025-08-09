export const FILE_STATUS = {
  MODIFIED: "M",
  ADDED: "A",
  DELETED: "D",
  STAGED: "S",
  UNKNOWN: "?",
  RENAMED: "R",
  CONFLICTED: "conflicted",
  // Combined statuses for files with multiple states
  DELETED_STAGED: "DS", // File deleted and staged
  ADDED_STAGED: "AS", // File added and staged
  MODIFIED_STAGED: "MS", // File modified and staged
  RENAMED_STAGED: "RS", // File renamed and staged
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export interface AccordionState {
  localBranches: boolean;
  remoteBranches: boolean;
  stagedChanges: boolean;
  unstagedChanges: boolean;
}

export interface RepoData {
  status?: GitStatus;
  branches?: GitBranches;
  log?: GitLog;
  currentBranch?: string;
  error?: string;
}

export interface FileWithStatus {
  path: string;
  status: FileStatus;
  originalPath?: string; // For renamed files, this contains the original path
}

export interface GitStatus {
  staged: FileWithStatus[];
  modified: FileWithStatus[];
  not_added: FileWithStatus[];
  deleted: FileWithStatus[];
  conflicted: FileWithStatus[];
  renamed: FileWithStatus[];
  current: string | null;
  ahead: number;
  behind: number;
}

export interface GitBranches {
  all: { name: string; sha: string | null }[];
  current: string;
  local: { name: string; sha: string | null }[];
  remote: { name: string; sha: string | null }[];
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
  parents?: string[]; // Array of parent commit hashes
}

export interface GitLog {
  all: GitCommit[];
}

export interface SavedRepository {
  path: string;
  name: string;
  lastOpened: number;
}
