"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function getToolCallLabel(
  toolName: string,
  args: Record<string, unknown>,
  isDone: boolean
): string {
  const path = (args?.path as string) ?? "file";

  if (toolName === "str_replace_editor") {
    switch (args?.command) {
      case "create":      return isDone ? `Created ${path}`    : `Creating ${path}`;
      case "str_replace": return isDone ? `Edited ${path}`     : `Editing ${path}`;
      case "insert":      return isDone ? `Updated ${path}`    : `Updating ${path}`;
      case "view":        return isDone ? `Read ${path}`        : `Reading ${path}`;
      default:            return isDone ? `Processed ${path}`  : `Processing ${path}`;
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path as string | undefined;
    switch (args?.command) {
      case "rename":
        return isDone
          ? `Renamed ${path}${newPath ? ` → ${newPath}` : ""}`
          : `Renaming ${path}`;
      case "delete": return isDone ? `Deleted ${path}` : `Deleting ${path}`;
      default:       return isDone ? `Managed ${path}` : `Managing ${path}`;
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const { toolName, args, state, result } = toolInvocation;
  const isDone = state === "result" && result != null;
  const label = getToolCallLabel(toolName, args, isDone);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
