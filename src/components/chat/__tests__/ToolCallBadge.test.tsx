import { test, describe, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

describe("getToolCallLabel", () => {
  describe("str_replace_editor", () => {
    test("create in progress", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, false))
        .toBe("Creating /App.jsx");
    });
    test("create done", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" }, true))
        .toBe("Created /App.jsx");
    });
    test("str_replace in progress", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, false))
        .toBe("Editing /App.jsx");
    });
    test("str_replace done", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }, true))
        .toBe("Edited /App.jsx");
    });
    test("insert in progress", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, false))
        .toBe("Updating /App.jsx");
    });
    test("insert done", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }, true))
        .toBe("Updated /App.jsx");
    });
    test("view in progress", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, false))
        .toBe("Reading /App.jsx");
    });
    test("view done", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" }, true))
        .toBe("Read /App.jsx");
    });
    test("unknown command falls back to Processed/Processing", () => {
      expect(getToolCallLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" }, false))
        .toBe("Processing /App.jsx");
      expect(getToolCallLabel("str_replace_editor", { command: "unknown", path: "/App.jsx" }, true))
        .toBe("Processed /App.jsx");
    });
  });

  describe("file_manager", () => {
    test("rename in progress", () => {
      expect(getToolCallLabel("file_manager", { command: "rename", path: "/Old.jsx", new_path: "/New.jsx" }, false))
        .toBe("Renaming /Old.jsx");
    });
    test("rename done shows both paths", () => {
      expect(getToolCallLabel("file_manager", { command: "rename", path: "/Old.jsx", new_path: "/New.jsx" }, true))
        .toBe("Renamed /Old.jsx → /New.jsx");
    });
    test("rename done without new_path", () => {
      expect(getToolCallLabel("file_manager", { command: "rename", path: "/Old.jsx" }, true))
        .toBe("Renamed /Old.jsx");
    });
    test("delete in progress", () => {
      expect(getToolCallLabel("file_manager", { command: "delete", path: "/App.jsx" }, false))
        .toBe("Deleting /App.jsx");
    });
    test("delete done", () => {
      expect(getToolCallLabel("file_manager", { command: "delete", path: "/App.jsx" }, true))
        .toBe("Deleted /App.jsx");
    });
  });

  test("falls back to tool name for unknown tools", () => {
    expect(getToolCallLabel("unknown_tool", {}, false)).toBe("unknown_tool");
  });

  test("uses 'file' when path is missing", () => {
    expect(getToolCallLabel("str_replace_editor", { command: "create" }, false))
      .toBe("Creating file");
  });
});

describe("ToolCallBadge", () => {
  test("shows spinner and in-progress label when not done", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "call",
        }}
      />
    );
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeNull();
  });

  test("shows green dot and past-tense label when done", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
          result: "File created: /App.jsx",
        }}
      />
    );
    expect(screen.getByText("Created /App.jsx")).toBeDefined();
    expect(container.querySelector(".bg-emerald-500")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeNull();
  });

  test("treats missing result as not done even when state is result", () => {
    const { container } = render(
      <ToolCallBadge
        toolInvocation={{
          toolName: "str_replace_editor",
          args: { command: "create", path: "/App.jsx" },
          state: "result",
        }}
      />
    );
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
    expect(container.querySelector(".animate-spin")).toBeDefined();
  });

  test("shows rename label with both paths when done", () => {
    render(
      <ToolCallBadge
        toolInvocation={{
          toolName: "file_manager",
          args: { command: "rename", path: "/Old.jsx", new_path: "/New.jsx" },
          state: "result",
          result: "File renamed",
        }}
      />
    );
    expect(screen.getByText("Renamed /Old.jsx → /New.jsx")).toBeDefined();
  });

  test("falls back to raw tool name for unknown tools", () => {
    render(
      <ToolCallBadge
        toolInvocation={{
          toolName: "unknown_tool",
          args: {},
          state: "call",
        }}
      />
    );
    expect(screen.getByText("unknown_tool")).toBeDefined();
  });
});
