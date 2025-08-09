#!/bin/bash

# Git Conflict Simulation Script
# This script creates two dummy branches with conflicting changes to simulate merge conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Git Conflict Simulation Script${NC}"
echo "=================================="

# Generate unique branch names with timestamp
TIMESTAMP=$(date +%s)
BRANCH1="test-branch-1-$TIMESTAMP"
BRANCH2="test-branch-2-$TIMESTAMP"
CONFLICT_FILE="conflict-test.txt"

# Function to cleanup previous test files and branches
cleanup_previous_tests() {
    echo -e "${YELLOW}🧹 Cleaning up previous test branches and files...${NC}"
    
    # Remove conflict test file if it exists
    if [ -f "$CONFLICT_FILE" ]; then
        rm "$CONFLICT_FILE"
        echo "Removed $CONFLICT_FILE"
    fi
    
    # Remove any previous test branches
    git branch | grep -E "test-branch-[12]-[0-9]+" | while read branch; do
        branch=$(echo "$branch" | sed 's/^\*//' | xargs)
        if [ "$branch" != "" ]; then
            git branch -D "$branch" 2>/dev/null || true
            echo "Removed branch: $branch"
        fi
    done
    
    # Reset to main branch
    git checkout main 2>/dev/null || git checkout master 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to create conflicting changes
create_conflict() {
    echo -e "${YELLOW}🌿 Creating branch: $BRANCH1${NC}"
    git checkout -b "$BRANCH1"
    
    # Create initial file with some content
    cat > "$CONFLICT_FILE" << EOF
This is a test file for conflict simulation
Line 2: Original content
Line 3: This line will cause conflict
Line 4: More content here
Line 5: End of file
EOF
    
    git add "$CONFLICT_FILE"
    git commit -m "Add initial conflict test file"
    
    echo -e "${YELLOW}🌿 Creating branch: $BRANCH2${NC}"
    git checkout -b "$BRANCH2"
    
    # Modify the same file with conflicting content
    cat > "$CONFLICT_FILE" << EOF
This is a test file for conflict simulation
Line 2: Original content
Line 3: This line has DIFFERENT content - BRANCH 2 VERSION
Line 4: More content here
Line 5: End of file
EOF
    
    git add "$CONFLICT_FILE"
    git commit -m "Modify conflict test file in branch 2"
    
    # Go back to first branch and make conflicting changes
    git checkout "$BRANCH1"
    cat > "$CONFLICT_FILE" << EOF
This is a test file for conflict simulation
Line 2: Original content
Line 3: This line has CONFLICTING content - BRANCH 1 VERSION
Line 4: More content here
Line 5: End of file
EOF
    
    git add "$CONFLICT_FILE"
    git commit -m "Modify conflict test file in branch 1"
    
    echo -e "${GREEN}✅ Branches created with conflicting changes${NC}"
}

# Function to trigger the conflict
trigger_conflict() {
    echo -e "${YELLOW}⚡ Attempting to merge $BRANCH2 into $BRANCH1...${NC}"
    
    # This should create a conflict
    if git merge "$BRANCH2" --no-commit --no-ff; then
        echo -e "${RED}❌ No conflict occurred! Something went wrong.${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Conflict successfully created!${NC}"
        echo -e "${RED}📍 Current status: MERGE CONFLICT${NC}"
        echo ""
        echo "Git status:"
        git status
        echo ""
        echo "Conflicted file content:"
        echo "========================"
        cat "$CONFLICT_FILE"
        echo "========================"
        echo ""
        echo -e "${GREEN}🎉 Conflict simulation complete!${NC}"
        echo -e "${YELLOW}💡 You can now test your conflict resolution tools${NC}"
        echo -e "${YELLOW}💡 Run 'git merge --abort' to cancel the merge${NC}"
        echo -e "${YELLOW}💡 Or resolve the conflict and commit${NC}"
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -c, --cleanup  Only cleanup previous test branches and files"
    echo "  -n, --no-cleanup  Skip cleanup step"
    echo ""
    echo "This script creates two branches with conflicting changes and attempts to merge them."
}

# Parse command line arguments
CLEANUP_ONLY=false
SKIP_CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--cleanup)
            CLEANUP_ONLY=true
            shift
            ;;
        -n|--no-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
if [ "$CLEANUP_ONLY" = true ]; then
    cleanup_previous_tests
    exit 0
fi

if [ "$SKIP_CLEANUP" = false ]; then
    cleanup_previous_tests
fi

create_conflict
trigger_conflict

echo ""
echo -e "${GREEN}🏁 Branch names created:${NC}"
echo -e "   ${YELLOW}$BRANCH1${NC} (current)"
echo -e "   ${YELLOW}$BRANCH2${NC}"
echo -e "${GREEN}🔄 Run this script again to create a new conflict scenario${NC}" 