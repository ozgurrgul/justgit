const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const simpleGit = require("simple-git");
const Store = require("electron-store");

let mainWindow;

// Initialize electron-store for persistence
const store = new Store({
  defaults: {
    activeRepoPath: null,
    savedRepositories: [],
    preferences: {
      maxRecentRepos: 10,
    },
    settings: {
      theme: "dark",
      diffViewMode: "split",
      autoFetch: false,
      autoFetchInterval: 5,
      confirmDeleteBranch: true,
      gitPath: "/usr/bin/git",
    },
  },
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    titleBarStyle: "hiddenInset",
    icon: path.join(__dirname, "assets/icon.png"),
    show: false,
  });

  // Load from Vite dev server in development, or from built files in production
  if (process.argv.includes("--dev")) {
    mainWindow.loadURL("http://127.0.0.1:9999");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for Git operations
ipcMain.handle("select-repository", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Git Repository",
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("get-repo-status", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();
    const branches = await git.branchLocal();
    const remoteBranches = await git.branch(["-r"]);

    // Clean and serialize the data for IPC
    // Parse the detailed file status to properly separate staged and unstaged files
    const staged = [];
    const modified = [];
    const not_added = [];
    const deleted = [];
    const conflicted = [];
    const renamed = [];

    // Process each file's detailed status
    for (const file of status.files || []) {
      const { path, index, working_dir } = file;

      // Handle conflicted files first
      if (index === "U" || working_dir === "U") {
        conflicted.push({ path, status: "conflicted" });
        continue;
      }

      // Handle combined statuses first (files with both index and working directory changes)
      if (index === "D" && working_dir === " ") {
        // File deleted and staged
        staged.push({ path, status: "DS" });
      } else if (index === "A" && working_dir === " ") {
        // File added and staged
        staged.push({ path, status: "AS" });
      } else if (index === "M" && working_dir === " ") {
        // File modified and staged
        staged.push({ path, status: "MS" });
      } else if (index === "R" && working_dir === " ") {
        // File renamed and staged
        // simple-git may provide rename info in different ways
        let originalPath = null;
        let newPath = path;

        // Check if the path contains rename arrow notation "old -> new"
        if (path.includes(" -> ")) {
          const parts = path.split(" -> ");
          originalPath = parts[0].trim();
          newPath = parts[1].trim();
        } else if (file.from) {
          // Some versions may provide 'from' property
          originalPath = file.from;
        }

        renamed.push({
          path: newPath,
          status: "RS",
          originalPath: originalPath,
        });
      } else if (index === "A" && working_dir === "M") {
        // File added and staged, but also modified in working directory
        staged.push({ path, status: "AS" });
        modified.push({ path, status: "M" });
      } else if (index === "M" && working_dir === "M") {
        // File modified and staged, but also modified in working directory
        staged.push({ path, status: "MS" });
        modified.push({ path, status: "M" });
      } else if (index === "D" && working_dir === "M") {
        // File deleted in index but modified in working directory (unlikely but possible)
        staged.push({ path, status: "DS" });
        modified.push({ path, status: "M" });
      } else {
        // Handle single statuses

        // Handle staged changes (index column)
        if (index === "A") {
          staged.push({ path, status: "A" });
        } else if (index === "M") {
          staged.push({ path, status: "M" });
        } else if (index === "D") {
          staged.push({ path, status: "D" });
        } else if (index === "R") {
          // File renamed and staged
          let originalPath = null;
          let newPath = path;

          // Check if the path contains rename arrow notation "old -> new"
          if (path.includes(" -> ")) {
            const parts = path.split(" -> ");
            originalPath = parts[0].trim();
            newPath = parts[1].trim();
          } else if (file.from) {
            // Some versions may provide 'from' property
            originalPath = file.from;
          }

          renamed.push({
            path: newPath,
            status: "RS",
            originalPath: originalPath,
          });
        }

        // Handle working directory changes (working_dir column)
        if (working_dir === "M") {
          modified.push({ path, status: "M" });
        } else if (working_dir === "D") {
          deleted.push({ path, status: "D" });
        } else if (working_dir === "?") {
          not_added.push({ path, status: "A" });
        }
      }
    }

    const cleanStatus = {
      staged,
      modified,
      not_added,
      deleted,
      conflicted,
      renamed,
      current: status.current || null,
      ahead: status.ahead || 0,
      behind: status.behind || 0,
    };

    const localBranches = branches.all
      ? branches.all.map((branchName) => ({
          name: branchName,
          sha: branches.branches[branchName]?.commit || null,
        }))
      : [];

    const remoteBranchesClean = remoteBranches.all
      ? remoteBranches.all
          .filter((branch) => !branch.includes("HEAD"))
          .map((branchName) => ({
            name: branchName,
            sha: remoteBranches.branches[branchName]?.commit || null,
          }))
      : [];

    const cleanBranches = {
      all: [...localBranches, ...remoteBranchesClean],
      current: branches.current || "master",
      local: localBranches,
      remote: remoteBranchesClean,
    };

    return {
      status: cleanStatus,
      branches: cleanBranches,
      currentBranch: cleanBranches.current,
    };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-add", async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.add(files);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-reset", async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    await git.reset(["HEAD", "--", ...files]);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-discard", async (event, repoPath, files) => {
  try {
    const git = simpleGit(repoPath);
    // Use git restore to discard changes in working directory
    await git.raw(["restore", "--", ...files]);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

// Interactive staging: Apply patch to staging area
ipcMain.handle(
  "git-apply-patch",
  async (event, repoPath, patch, staged = false) => {
    try {
      const git = simpleGit(repoPath);
      const args = ["apply"];

      if (staged) {
        args.push("--cached");
      }

      // Use git raw to apply patch from stdin
      await git.raw([...args, "--"], { input: patch });
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

// Interactive staging: Generate patch for specific lines
ipcMain.handle(
  "git-generate-patch",
  async (event, repoPath, filePath, startLine, endLine, staged = false) => {
    try {
      const git = simpleGit(repoPath);
      let diff;

      if (staged) {
        diff = await git.diff(["--staged", "--", filePath]);
      } else {
        diff = await git.diff(["--", filePath]);
      }

      // Parse diff and extract specific lines
      const lines = diff.split("\n");
      const patchLines = [];
      let inHunk = false;
      let hunkStartLine = 0;
      let currentLine = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("@@")) {
          inHunk = true;
          const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
          if (match) {
            hunkStartLine = parseInt(match[3]);
            currentLine = hunkStartLine;
          }
          patchLines.push(line);
        } else if (
          inHunk &&
          (line.startsWith("---") || line.startsWith("+++"))
        ) {
          patchLines.push(line);
        } else if (inHunk && line.startsWith("diff --git")) {
          patchLines.push(line);
        } else if (inHunk) {
          if (
            line.startsWith("+") ||
            line.startsWith("-") ||
            line.startsWith(" ")
          ) {
            if (currentLine >= startLine && currentLine <= endLine) {
              patchLines.push(line);
            }
            if (line.startsWith("+") || line.startsWith(" ")) {
              currentLine++;
            }
          }
        }
      }

      return { success: true, patch: patchLines.join("\n") };
    } catch (error) {
      return { error: error.message };
    }
  }
);

// Conflict resolution: Get conflicted files
ipcMain.handle("git-get-conflicts", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const status = await git.status();

    const conflicts = status.conflicted.map((filePath) => ({
      path: filePath,
      content: null,
    }));

    // Read file contents for each conflicted file
    const fs = require("fs");
    const path = require("path");

    for (const conflict of conflicts) {
      try {
        const fullPath = path.join(repoPath, conflict.path);
        conflict.content = fs.readFileSync(fullPath, "utf8");
      } catch (readError) {
        conflict.content = null;
      }
    }

    return { success: true, conflicts };
  } catch (error) {
    return { error: error.message };
  }
});

// Conflict resolution: Resolve conflict with "ours" or "theirs"
ipcMain.handle(
  "git-resolve-conflict",
  async (event, repoPath, filePath, resolution) => {
    try {
      const git = simpleGit(repoPath);

      if (resolution === "ours") {
        await git.raw(["checkout", "--ours", filePath]);
      } else if (resolution === "theirs") {
        await git.raw(["checkout", "--theirs", filePath]);
      }

      // Mark as resolved
      await git.add(filePath);

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

// Conflict resolution: Save resolved file content
ipcMain.handle(
  "git-save-resolved-file",
  async (event, repoPath, filePath, content) => {
    try {
      const fs = require("fs");
      const path = require("path");

      const fullPath = path.join(repoPath, filePath);
      fs.writeFileSync(fullPath, content, "utf8");

      const git = simpleGit(repoPath);
      await git.add(filePath);

      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle("git-commit", async (event, repoPath, message, options = {}) => {
  try {
    const git = simpleGit(repoPath);
    const commitOptions = [];

    // Add amend flag if needed
    if (options.amend) {
      commitOptions.push("--amend");
    }

    // Add no-verify flag if skip hooks is enabled
    if (options.skipHooks) {
      commitOptions.push("--no-verify");
    }

    // For simple-git, when committing all staged files, pass message and options directly
    // Don't pass undefined as files parameter
    const result = await git.commit(message, commitOptions);
    return { success: true, result };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-checkout", async (event, repoPath, branch) => {
  try {
    const git = simpleGit(repoPath);
    await git.checkout(branch);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-pull", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.pull();
    return { success: true, result };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-push", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const result = await git.push();
    return { success: true, result };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "git-push-set-upstream",
  async (event, repoPath, remoteName, branchName) => {
    try {
      const git = simpleGit(repoPath);
      const result = await git.push(["-u", remoteName, branchName]);
      return { success: true, result };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle("git-check-upstream", async (event, repoPath) => {
  try {
    const git = simpleGit(repoPath);
    const branches = await git.branch();
    const currentBranch = branches.current;

    if (!currentBranch) {
      return { success: true, hasUpstream: false };
    }

    // Check if current branch has an upstream
    const branchInfo = await git.raw(["branch", "-vv"]);
    const lines = branchInfo.split("\n");
    const currentBranchLine = lines.find((line) =>
      line.startsWith("* " + currentBranch)
    );

    if (currentBranchLine) {
      // Check if the line contains upstream info (format: [remote/branch])
      const hasUpstream = /\[.+\]/.test(currentBranchLine);
      return { success: true, hasUpstream, currentBranch };
    }

    return { success: true, hasUpstream: false, currentBranch };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("git-delete-branch", async (event, repoPath, branch) => {
  try {
    const git = simpleGit(repoPath);
    await git.raw(["branch", "-D", branch]);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle(
  "git-delete-remote-branch",
  async (event, repoPath, remoteName, branchName) => {
    try {
      const git = simpleGit(repoPath);
      await git.push([remoteName, "--delete", branchName]);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle(
  "git-rename-branch",
  async (event, repoPath, oldName, newName) => {
    try {
      const git = simpleGit(repoPath);
      await git.branch(["-m", oldName, newName]);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle(
  "git-create-branch",
  async (event, repoPath, branchName, startPoint) => {
    try {
      const git = simpleGit(repoPath);
      if (startPoint) {
        await git.checkoutBranch(branchName, startPoint);
      } else {
        await git.checkoutLocalBranch(branchName);
      }
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle("git-merge-branch", async (event, repoPath, branch) => {
  const git = simpleGit(repoPath);
  try {
    const result = await git.merge([branch]);
    return { success: true, result };
  } catch (error) {
    // Check if the error is about local changes being overwritten
    if (
      error.message.includes(
        "Your local changes to the following files would be overwritten by merge"
      )
    ) {
      try {
        // First check if we have any local changes
        const status = await git.status();
        const hasLocalChanges = status.files.length > 0;

        if (hasLocalChanges) {
          // Stash local changes
          await git.stash(["push", "-m", "Auto-stash before merge"]);

          // Try merge again
          try {
            const mergeResult = await git.merge([branch]);

            // Try to apply stash back
            try {
              await git.stash(["pop"]);
              return {
                success: true,
                result: "Merge completed with stash applied",
              };
            } catch (stashError) {
              // Stash application failed, likely due to conflicts
              // const newStatus = await git.status();
              // if (newStatus.conflicted && newStatus.conflicted.length > 0) {
              //   return {
              //     success: true,
              //     hasConflicts: true,
              //     conflicts: newStatus.conflicted,
              //   };
              // } else {
              //   return {
              //     success: true,
              //     result: "Merge completed, but stash application failed",
              //     warning: stashError.message,
              //   };
              // }
            }
          } catch (mergeError) {
            // Merge failed even after stashing, restore stash and return error
            try {
              await git.stash(["pop"]);
            } catch (restoreError) {
              // Unable to restore stash, this is a more serious issue
              return {
                error: `Merge failed and unable to restore stash: ${mergeError.message}`,
              };
            }
            return { error: mergeError.message };
          }
        } else {
          // No local changes detected, this shouldn't happen, but return the original error
          return { error: error.message };
        }
      } catch (stashError) {
        return { error: `Failed to stash changes: ${stashError.message}` };
      }
    } else if (
      error.message.includes("CONFLICT") ||
      error.message.includes("Automatic merge failed")
    ) {
      // Direct conflict during merge
      const status = await git.status();
      return {
        success: true,
        hasConflicts: true,
        conflicts: status.conflicted || [],
      };
    } else {
      return { error: error.message };
    }
  }
});

ipcMain.handle("git-cherry-pick", async (event, repoPath, commitHash) => {
  const git = simpleGit(repoPath);
  try {
    // First, check if this is a merge commit
    const commitInfo = await git.raw([
      "show",
      "--format=%P",
      "--no-patch",
      commitHash,
    ]);
    const parents = commitInfo
      .trim()
      .split(" ")
      .filter((p) => p);

    let result;
    if (parents.length > 1) {
      // This is a merge commit, use -m 1 to specify the mainline
      result = await git.raw(["cherry-pick", "-m", "1", commitHash]);
    } else {
      // Regular commit
      result = await git.raw(["cherry-pick", commitHash]);
    }

    return { success: true, result };
  } catch (error) {
    // Check if the error is about conflicts
    if (
      error.message.includes("CONFLICT") ||
      error.message.includes("cherry-pick") ||
      error.message.includes("conflict")
    ) {
      const status = await git.status();
      return {
        success: true,
        hasConflicts: true,
        conflicts: status.conflicted || [],
      };
    } else {
      return { error: error.message };
    }
  }
});

ipcMain.handle("git-revert", async (event, repoPath, commitHash) => {
  const git = simpleGit(repoPath);
  try {
    // First, check if this is a merge commit
    const commitInfo = await git.raw([
      "show",
      "--format=%P",
      "--no-patch",
      commitHash,
    ]);
    const parents = commitInfo
      .trim()
      .split(" ")
      .filter((p) => p);

    let result;
    if (parents.length > 1) {
      // This is a merge commit, use -m 1 to specify the mainline
      result = await git.raw(["revert", "-m", "1", commitHash, "--no-edit"]);
    } else {
      // Regular commit
      result = await git.raw(["revert", commitHash, "--no-edit"]);
    }

    return { success: true, result };
  } catch (error) {
    // Check if the error is about conflicts
    if (
      error.message.includes("CONFLICT") ||
      error.message.includes("revert") ||
      error.message.includes("conflict")
    ) {
      const status = await git.status();
      return {
        success: true,
        hasConflicts: true,
        conflicts: status.conflicted || [],
      };
    } else {
      return { error: error.message };
    }
  }
});

ipcMain.handle(
  "git-diff",
  async (event, repoPath, filePath, staged, commitHash) => {
    try {
      const git = simpleGit(repoPath);
      let diff;

      if (commitHash) {
        // Show diff for a specific commit
        if (filePath) {
          diff = await git.diff([`${commitHash}^`, commitHash, "--", filePath]);
        } else {
          diff = await git.diff([`${commitHash}^`, commitHash]);
        }
      } else if (filePath) {
        // Show diff for a specific file
        if (staged) {
          diff = await git.diff(["--staged", filePath]);
        } else {
          diff = await git.diff([filePath]);
        }
      } else {
        // Show all diffs
        if (staged) {
          diff = await git.diff(["--staged"]);
        } else {
          diff = await git.diff();
        }
      }

      return { success: true, diff };
    } catch (error) {
      return { error: error.message };
    }
  }
);

ipcMain.handle("git-commit-diff", async (event, repoPath, commitHash) => {
  try {
    const git = simpleGit(repoPath);

    // Get the diff for the commit
    const diff = await git.diff([`${commitHash}^`, commitHash]);

    // Get the list of files changed in the commit with status
    const show = await git.show([commitHash, "--name-status", "--format="]);
    const fileLines = show.split("\n").filter((line) => line.trim() !== "");

    // Parse the file status information
    const files = fileLines.map((line) => {
      const parts = line.split("\t");
      const status = parts[0];
      const filePath = parts[1];
      return { status, path: filePath };
    });

    return { success: true, diff, files };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("get-commit-signature", async (event, repoPath, commitHash) => {
  try {
    const git = simpleGit(repoPath);

    // Get signature information for specific commit
    const result = await git.raw([
      "log",
      "-1",
      commitHash,
      "--pretty=format:%G?|%GS|%GK|%GF",
    ]);

    const [
      signature_status,
      signature_signer,
      signature_key,
      signature_fingerprint,
    ] = result.split("|");

    return {
      success: true,
      signature: {
        status: signature_status || null,
        signer: signature_signer || null,
        key: signature_key || null,
        fingerprint: signature_fingerprint || null,
      },
    };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("get-commits", async (event, repoPath, skip = 0, maxCount) => {
  try {
    const git = simpleGit(repoPath);

    // Use raw git command to avoid simple-git limitations
    const result = await git.raw([
      "log",
      "--all",
      `--max-count=${maxCount}`,
      `--skip=${skip}`,
      "--pretty=format:%H|%ai|%s|%an|%ae|%P",
    ]);

    const lines = result.split("\n").filter((line) => line.trim() !== "");
    const commits = lines.map((line) => {
      const [hash, date, message, author_name, author_email, parents] =
        line.split("|");
      return {
        hash,
        date,
        message,
        author_name,
        author_email,
        parents: parents
          ? parents.split(" ").filter((p) => p.trim() !== "")
          : [],
      };
    });

    return { success: true, log: { all: commits } };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("save-repositories", async (event, repositoriesPaths) => {
  try {
    // Save only the repository paths and basic metadata
    const reposToSave = repositoriesPaths.map((repoPath) => ({
      path: repoPath,
      name: path.basename(repoPath),
      savedAt: Date.now(),
    }));

    store.set("savedRepositories", reposToSave);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("get-saved-repositories", async () => {
  try {
    const savedRepos = store.get("savedRepositories", []);
    return { repositories: savedRepos };
  } catch (error) {
    return { error: error.message };
  }
});

// Context menu handler
ipcMain.handle("show-context-menu", async (event, menuItems) => {
  const template = menuItems.map((item) => {
    if (item.type === "separator") {
      return { type: "separator" };
    }

    return {
      label: item.label,
      click: () => {
        event.sender.send("context-menu-action", item.action, item.data);
      },
    };
  });

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

// Settings handlers
ipcMain.handle("get-settings", async () => {
  try {
    const settings = store.get("settings");
    return { success: true, settings };
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle("save-settings", async (event, settings) => {
  try {
    store.set("settings", settings);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
