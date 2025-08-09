import { CommitGraphCommit } from "@/components/history/graph/CommitGraphTypes";
import { GitCommit } from "@/types/types";

export function commitsToCommitGraphCommits(
  commits: GitCommit[],
  branches: { name: string; sha: string | null }[]
): CommitGraphCommit[] {
  // Create a map of commit hash to branch names (for head commits only)
  const commitToBranchMap = new Map<string, string[]>();

  branches.forEach((branch) => {
    if (branch.sha) {
      // Find the matching commit for this branch SHA
      const matchingCommit = commits.find((commit) => {
        // Exact match (full SHA)
        if (commit.hash === branch.sha) return true;

        // Branch SHA is a short SHA, check if commit hash starts with it
        if (commit.hash.startsWith(branch.sha!)) return true;

        // Commit hash is longer, check if branch SHA starts with the commit hash (shouldn't happen but just in case)
        if (branch.sha!.startsWith(commit.hash)) return true;

        return false;
      });

      if (matchingCommit) {
        const existingBranches =
          commitToBranchMap.get(matchingCommit.hash) || [];
        commitToBranchMap.set(matchingCommit.hash, [
          ...existingBranches,
          branch.name,
        ]);
      }
    }
  });

  return commits.map((commit) => {
    const branchNames = commitToBranchMap.get(commit.hash) || [];

    return {
      sha: commit.hash,
      commit: {
        author: {
          name: commit.author_name,
          date: commit.date,
          email: commit.author_email,
        },
        message: commit.message,
      },
      parents: commit.parents?.map((parent) => ({ sha: parent })) ?? [],
      branches: branchNames,
    };
  });
}
