import React from "react";
import { List, AutoSizer } from "react-virtualized";
import "react-virtualized/styles.css";
import { BranchAction } from "./BranchContextMenu";
import { BranchesListItem } from "./ BranchesListItem";

interface Props {
  branches: string[];
  currentBranch?: string;
  actions: BranchAction[];
  height?: number;
}

export const BranchesList: React.FC<Props> = ({
  branches,
  currentBranch,
  actions,
  height = 200,
}) => {
  const isActiveBranch = (branch: string) => branch === currentBranch;

  const rowRenderer = ({ index, key, style }: any) => {
    const branch = branches[index];

    return (
      <div key={key} style={style}>
        <BranchesListItem
          branch={branch}
          isActiveBranch={isActiveBranch(branch)}
          actions={actions}
        />
      </div>
    );
  };

  // If there are no branches, return empty state
  if (!branches.length) {
    return null;
  }

  return (
    <div style={{ height }}>
      <AutoSizer>
        {({ height: autoHeight, width }) => (
          <List
            height={autoHeight}
            width={width}
            rowCount={branches.length}
            rowHeight={24}
            rowRenderer={rowRenderer}
            overscanRowCount={10} // Render extra rows for smooth scrolling
            style={{
              outline: "none", // Remove focus outline
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
};
