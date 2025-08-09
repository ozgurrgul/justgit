export function parseConventionalCommit(message: string) {
  // Regex to match conventional commit format: type(scope): description
  const conventionalRegex = /^([a-zA-Z]+)(\([^)]+\))?:\s*(.+)/;
  const match = message.match(conventionalRegex);

  if (match) {
    const type = match[1];
    const scope = match[2] ? match[2].slice(1, -1) : undefined; // Remove parentheses
    const description = match[3];

    return {
      type,
      scope,
      description,
      isConventional: true,
    };
  }

  return {
    type: "",
    description: message,
    isConventional: false,
  };
}

export function getConventionalCommitColor(type: string): string {
  switch (type.toLowerCase()) {
    case "feat":
      return "teal";
    case "fix":
      return "red";
    case "docs":
      return "blue";
    case "style":
      return "violet";
    case "refactor":
      return "orange";
    case "test":
      return "cyan";
    case "chore":
      return "gray";
    case "build":
      return "indigo";
    case "ci":
      return "grape";
    case "perf":
      return "yellow";
    case "revert":
      return "pink";
    default:
      return "gray";
  }
}
