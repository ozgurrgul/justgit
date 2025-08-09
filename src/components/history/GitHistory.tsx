import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setActiveCommitHash,
  setSidebarUiMode,
  loadCommits,
} from "@/store/appSlice";
import {
  selectActiveRepoPath,
  selectCurrentBranch,
  selectHasMoreCommits,
  selectIsLoadingMoreCommits,
  selectCommitPagination,
  selectCommitGraphCommits,
} from "@/store/selectors";
import { Loader } from "@mantine/core";
import { CommitGraph } from "./graph/CommitGraph/CommitGraph";
import InfiniteScroll from "react-infinite-scroller";
import { useSelector } from "react-redux";

export const GitHistory = () => {
  const dispatch = useAppDispatch();
  const activeRepoPath = useAppSelector(selectActiveRepoPath);
  const commitGraphCommits = useSelector(selectCommitGraphCommits);
  const currentBranch = useAppSelector(selectCurrentBranch);
  const hasMoreCommits = useAppSelector(selectHasMoreCommits);
  const isLoadingMoreCommits = useAppSelector(selectIsLoadingMoreCommits);
  const commitPagination = useAppSelector(selectCommitPagination);

  const handleCommitClick = useCallback(
    (commitHash: string) => {
      if (activeRepoPath) {
        dispatch(setSidebarUiMode("commit-details"));
        dispatch(setActiveCommitHash(commitHash));
      }
    },
    [dispatch, activeRepoPath]
  );

  const handleLoadMore = useCallback(() => {
    if (activeRepoPath && hasMoreCommits && !isLoadingMoreCommits) {
      dispatch(
        loadCommits({
          repoPath: activeRepoPath,
          skip: commitPagination.skip,
        })
      );
    }
  }, [
    dispatch,
    activeRepoPath,
    hasMoreCommits,
    isLoadingMoreCommits,
    commitPagination.skip,
  ]);

  return (
    <div
      style={{
        height: "calc(100vh - 80px)",
        paddingTop: "6px",
        overflow: "auto",
        marginTop: "8px",
      }}
      className="git-history-container"
    >
      <InfiniteScroll
        pageStart={0}
        loadMore={handleLoadMore}
        hasMore={hasMoreCommits && !isLoadingMoreCommits}
        loader={
          <div key="loader" style={{ textAlign: "center", padding: "20px" }}>
            <Loader size="sm" />
          </div>
        }
        useWindow={false}
        getScrollParent={() => document.querySelector(".git-history-container")}
      >
        <CommitGraph
          commits={commitGraphCommits}
          currentBranch={currentBranch}
          onCommitClick={(commit) => handleCommitClick(commit.hash)}
        />
      </InfiniteScroll>
    </div>
  );
};
