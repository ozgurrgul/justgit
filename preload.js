const { contextBridge, ipcRenderer } = require("electron");

const inv = ipcRenderer.invoke;

contextBridge.exposeInMainWorld("electronAPI", {
  selectRepository: () => inv("select-repository"),
  getRepoStatus: (repoPath) => inv("get-repo-status", repoPath),
  gitAdd: (repoPath, files) => inv("git-add", repoPath, files),
  gitReset: (repoPath, files) => inv("git-reset", repoPath, files),
  gitDiscard: (repoPath, files) => inv("git-discard", repoPath, files),
  gitCommit: (repoPath, message, options) =>
    inv("git-commit", repoPath, message, options),
  gitCheckout: (repoPath, branch) => inv("git-checkout", repoPath, branch),
  gitPull: (repoPath) => inv("git-pull", repoPath),
  gitPush: (repoPath) => inv("git-push", repoPath),
  gitPushSetUpstream: (repoPath, remoteName, branchName) =>
    inv("git-push-set-upstream", repoPath, remoteName, branchName),
  gitCheckUpstream: (repoPath) => inv("git-check-upstream", repoPath),
  gitDeleteBranch: (repoPath, branch) =>
    inv("git-delete-branch", repoPath, branch),
  gitDeleteRemoteBranch: (repoPath, remoteName, branchName) =>
    inv("git-delete-remote-branch", repoPath, remoteName, branchName),
  gitRenameBranch: (repoPath, oldName, newName) =>
    inv("git-rename-branch", repoPath, oldName, newName),
  gitCreateBranch: (repoPath, branchName, startPoint) =>
    inv("git-create-branch", repoPath, branchName, startPoint),
  gitMergeBranch: (repoPath, branch) =>
    inv("git-merge-branch", repoPath, branch),
  gitCherryPick: (repoPath, commitHash) =>
    inv("git-cherry-pick", repoPath, commitHash),
  gitRevert: (repoPath, commitHash) => inv("git-revert", repoPath, commitHash),
  gitDiff: (repoPath, filePath, staged, commitHash) =>
    inv("git-diff", repoPath, filePath, staged, commitHash),
  gitCommitDiff: (repoPath, commitHash) =>
    inv("git-commit-diff", repoPath, commitHash),
  getCommits: (repoPath, skip, maxCount) =>
    inv("get-commits", repoPath, skip, maxCount),
  getCommitSignature: (repoPath, commitHash) =>
    inv("get-commit-signature", repoPath, commitHash),

  // Repository list persistence
  saveRepositories: (repositoriesPaths) =>
    inv("save-repositories", repositoriesPaths),
  getSavedRepositories: () => inv("get-saved-repositories"),

  // Interactive staging methods
  gitApplyPatch: (repoPath, patch, staged) =>
    inv("git-apply-patch", repoPath, patch, staged),
  gitGeneratePatch: (repoPath, filePath, startLine, endLine, staged) =>
    inv("git-generate-patch", repoPath, filePath, startLine, endLine, staged),

  // Conflict resolution methods
  gitGetConflicts: (repoPath) => inv("git-get-conflicts", repoPath),
  gitResolveConflict: (repoPath, filePath, resolution) =>
    inv("git-resolve-conflict", repoPath, filePath, resolution),
  gitSaveResolvedFile: (repoPath, filePath, content) =>
    inv("git-save-resolved-file", repoPath, filePath, content),

  // Context menu methods
  showContextMenu: (menuItems) => inv("show-context-menu", menuItems),
  onContextMenuAction: (callback) => {
    const wrapper = (event, action, data) => {
      callback(action, data);
    };
    ipcRenderer.on("context-menu-action", wrapper);
    return wrapper;
  },
  offContextMenuAction: (wrapper) => {
    ipcRenderer.removeListener("context-menu-action", wrapper);
  },

  // Settings methods
  getSettings: () => inv("get-settings"),
  saveSettings: (settings) => inv("save-settings", settings),
});
